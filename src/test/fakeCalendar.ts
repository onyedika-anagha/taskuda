import type { CalendarEvent } from '@/types/calendar'
import { jsonResponse, mockFetch } from './mockFetch'

interface StoredEvent extends CalendarEvent {
  seq: number
}

/**
 * In-memory Google Calendar behind a mocked `fetch`, with sync tokens that behave like the real
 * API: incremental lists return everything changed since the token, cancelled events included.
 */
export function installFakeCalendar() {
  const events = new Map<string, StoredEvent>()
  const state = { seq: 0, expireTokens: false, failNext: 0 }
  let ids = 0

  function touch(event: Omit<StoredEvent, 'seq' | 'updated'>): StoredEvent {
    state.seq++
    const stored: StoredEvent = {
      ...event,
      seq: state.seq,
      // Strictly increasing, later than any local edit made just before.
      updated: new Date(Date.now() + state.seq).toISOString(),
      etag: `"${state.seq}"`,
    }
    events.set(stored.id, stored)
    return stored
  }

  const strip = ({ seq: _seq, ...event }: StoredEvent): CalendarEvent => event

  const { requests } = mockFetch(async (request) => {
    if (state.failNext) {
      const status = state.failNext
      state.failNext = 0
      return jsonResponse({}, status)
    }
    const url = new URL(request.url)
    if (url.pathname === '/calendar/v3/users/me/calendarList') {
      return jsonResponse({
        items: [
          { id: 'primary-id', summary: 'Me', primary: true },
          { id: 'work-id', summary: 'Work' },
        ],
      })
    }
    const match = /^\/calendar\/v3\/calendars\/([^/]+)\/events(?:\/([^/]+))?$/.exec(url.pathname)
    if (!match) return jsonResponse({}, 404)
    const eventId = match[2] ? decodeURIComponent(match[2]) : null

    if (request.method === 'GET') {
      const token = url.searchParams.get('syncToken')
      if (token && state.expireTokens) {
        state.expireTokens = false
        return jsonResponse({ error: { code: 410 } }, 410)
      }
      const since = token ? Number(token.slice(1)) : null
      const items = [...events.values()]
        .filter((e) => (since === null ? e.status !== 'cancelled' : e.seq > since))
        .map(strip)
      return jsonResponse({ items, nextSyncToken: `s${state.seq}` })
    }
    if (request.method === 'POST') {
      const body = request.body as CalendarEvent
      return jsonResponse(strip(touch({ ...body, id: `evt-${++ids}`, status: 'confirmed' })))
    }
    const existing = eventId ? events.get(eventId) : undefined
    if (!existing || existing.status === 'cancelled') return jsonResponse({}, 404)
    if (request.method === 'PATCH') {
      return jsonResponse(strip(touch({ ...existing, ...(request.body as CalendarEvent) })))
    }
    if (request.method === 'DELETE') {
      touch({ ...existing, status: 'cancelled' })
      return new Response(null, { status: 204 })
    }
    return jsonResponse({}, 405)
  })

  const live = () => [...events.values()].filter((e) => e.status !== 'cancelled')

  return {
    requests,
    state,
    live,
    /** Someone adds an event in Google Calendar. */
    addRemote(event: Partial<CalendarEvent> & Pick<CalendarEvent, 'start' | 'end' | 'summary'>) {
      return strip(touch({ id: `remote-${++ids}`, status: 'confirmed', ...event }))
    },
    editRemote(id: string, change: Partial<CalendarEvent>) {
      const existing = events.get(id)
      if (!existing) throw new Error(`no event ${id}`)
      return strip(touch({ ...existing, ...change }))
    },
    deleteRemote(id: string) {
      const existing = events.get(id)
      if (!existing) throw new Error(`no event ${id}`)
      touch({ ...existing, status: 'cancelled' })
    },
  }
}
