import type { CalendarEvent, CalendarListEntry } from '@/types/calendar'
import { GoogleApiError, googleFetch } from './googleApi'

/**
 * Calendar v3 with the narrowest scopes that work (NFR7): events on calendars the user owns,
 * and a read-only calendar list to pick which one to sync with.
 */
export const CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events.owned',
  'https://www.googleapis.com/auth/calendar.calendarlist.readonly',
]

const API = 'https://www.googleapis.com/calendar/v3'

type Interactive = { interactive?: boolean }

const eventsUrl = (calendarId: string) => `${API}/calendars/${encodeURIComponent(calendarId)}/events`

export async function listOwnedCalendars(options?: Interactive): Promise<CalendarListEntry[]> {
  const params = new URLSearchParams({ minAccessRole: 'owner', fields: 'items(id,summary,primary)' })
  const response = await googleFetch(`${API}/users/me/calendarList?${params}`, CALENDAR_SCOPES, {}, options)
  const data = (await response.json()) as { items?: { id: string; summary?: string; primary?: boolean }[] }
  return (data.items ?? []).map((c) => ({ id: c.id, summary: c.summary ?? c.id, primary: !!c.primary }))
}

export class SyncTokenExpiredError extends Error {
  constructor() {
    super('The calendar sync token expired; a full sync is needed.')
    this.name = 'SyncTokenExpiredError'
  }
}

export interface EventsPage {
  events: CalendarEvent[]
  nextSyncToken: string | null
}

/**
 * All events since `syncToken`, or a full list from `timeMin` when there's no token. Follows pages;
 * the new sync token comes on the last one. Throws `SyncTokenExpiredError` on HTTP 410.
 */
export async function listEvents(
  calendarId: string,
  { syncToken, timeMin }: { syncToken?: string | null; timeMin: string },
  options?: Interactive,
): Promise<EventsPage> {
  const events: CalendarEvent[] = []
  let pageToken: string | undefined
  for (let page = 0; page < 50; page++) {
    // The same parameters on every request of a sync, as the API requires; timeMin only without a token.
    const params = new URLSearchParams({ singleEvents: 'true', maxResults: '250' })
    if (syncToken) params.set('syncToken', syncToken)
    else params.set('timeMin', timeMin)
    if (pageToken) params.set('pageToken', pageToken)
    let response: Response
    try {
      response = await googleFetch(`${eventsUrl(calendarId)}?${params}`, CALENDAR_SCOPES, {}, options)
    } catch (error) {
      if (error instanceof GoogleApiError && error.status === 410) throw new SyncTokenExpiredError()
      throw error
    }
    const data = (await response.json()) as {
      items?: CalendarEvent[]
      nextPageToken?: string
      nextSyncToken?: string
    }
    events.push(...(data.items ?? []))
    if (!data.nextPageToken) return { events, nextSyncToken: data.nextSyncToken ?? null }
    pageToken = data.nextPageToken
  }
  throw new GoogleApiError('bad-response')
}

export type EventInput = Pick<
  CalendarEvent,
  'summary' | 'description' | 'start' | 'end' | 'extendedProperties'
>

export async function insertEvent(calendarId: string, event: EventInput): Promise<CalendarEvent> {
  const response = await googleFetch(eventsUrl(calendarId), CALENDAR_SCOPES, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  })
  return (await response.json()) as CalendarEvent
}

export async function patchEvent(
  calendarId: string,
  eventId: string,
  event: EventInput,
): Promise<CalendarEvent> {
  const response = await googleFetch(
    `${eventsUrl(calendarId)}/${encodeURIComponent(eventId)}`,
    CALENDAR_SCOPES,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    },
  )
  return (await response.json()) as CalendarEvent
}

/** Already deleted (404/410) counts as done. */
export async function deleteEvent(calendarId: string, eventId: string): Promise<void> {
  try {
    await googleFetch(`${eventsUrl(calendarId)}/${encodeURIComponent(eventId)}`, CALENDAR_SCOPES, {
      method: 'DELETE',
    })
  } catch (error) {
    if (!(error instanceof GoogleApiError && (error.status === 404 || error.status === 410))) throw error
  }
}
