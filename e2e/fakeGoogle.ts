import type { BrowserContext, Route } from '@playwright/test'

/** A stand-in for https://accounts.google.com/gsi/client that grants every requested scope. */
const FAKE_GIS_SCRIPT = `
window.google = { accounts: { oauth2: {
  initTokenClient: (config) => ({
    requestAccessToken: () => setTimeout(() => config.callback({
      access_token: 'e2e-token', expires_in: 3599, scope: config.scope,
    }), 10),
  }),
  hasGrantedAllScopes: (response, ...scopes) => scopes.every((s) => (response.scope || '').split(' ').includes(s)),
  revoke: (_token, done) => done && done(),
} } }
`

interface StoredFile {
  id: string
  name: string
  createdTime: string
  appProperties: Record<string, string>
  content: string
}

/**
 * Fake Google sign-in plus an in-memory Drive app-data folder and Calendar. Share one instance
 * between browser contexts to act out "back up on device A, restore on device B".
 */
export function createFakeGoogle() {
  const files: StoredFile[] = []
  let counter = 0
  /** In-memory Google Calendar: event id → event, plus a change counter for sync tokens. */
  const events = new Map<string, Record<string, unknown> & { id: string; seq: number; status: string }>()
  let seq = 0

  function stamp(event: Record<string, unknown> & { id: string; status: string }) {
    seq++
    const stored = { ...event, seq, updated: new Date(Date.now() + seq).toISOString(), etag: `"${seq}"` }
    events.set(event.id, stored)
    return stored
  }

  async function handleCalendar(route: Route) {
    const request = route.request()
    const url = new URL(request.url())
    if (url.pathname.endsWith('/users/me/calendarList')) {
      return route.fulfill({ json: { items: [{ id: 'primary-id', summary: 'Me', primary: true }] } })
    }
    const eventId = /\/events\/([^/]+)$/.exec(url.pathname)?.[1]
    if (request.method() === 'GET') {
      const token = url.searchParams.get('syncToken')
      const since = token ? Number(token.slice(1)) : null
      const items = [...events.values()]
        .filter((e) => (since === null ? e.status !== 'cancelled' : e.seq > since))
        .map(({ seq: _seq, ...e }) => e)
      return route.fulfill({ json: { items, nextSyncToken: `s${seq}` } })
    }
    if (request.method() === 'POST') {
      const { seq: _seq, ...created } = stamp({
        ...request.postDataJSON(),
        id: `evt-${++counter}`,
        status: 'confirmed',
      })
      return route.fulfill({ json: created })
    }
    const existing = eventId ? events.get(decodeURIComponent(eventId)) : undefined
    if (!existing) return route.fulfill({ status: 404, json: {} })
    if (request.method() === 'PATCH') {
      const { seq: _seq, ...patched } = stamp({ ...existing, ...request.postDataJSON() })
      return route.fulfill({ json: patched })
    }
    stamp({ ...existing, status: 'cancelled' })
    return route.fulfill({ status: 204, body: '' })
  }

  async function handleGoogleApis(route: Route) {
    const request = route.request()
    const url = new URL(request.url())
    if (request.headers().authorization !== 'Bearer e2e-token')
      return route.fulfill({ status: 401, json: {} })
    if (url.pathname.startsWith('/calendar/')) return handleCalendar(route)

    if (url.pathname === '/upload/drive/v3/files' && request.method() === 'POST') {
      const body = request.postData() ?? ''
      const boundary = body.split('\r\n')[0]
      const parts = body
        .split(boundary)
        .slice(1, -1)
        .map((p) => p.split('\r\n\r\n').slice(1).join('\r\n\r\n').replace(/\r\n$/, ''))
      const metadata = JSON.parse(parts[0])
      const file: StoredFile = {
        id: `file-${++counter}`,
        name: metadata.name,
        createdTime: new Date(Date.now() + counter).toISOString(),
        appProperties: metadata.appProperties,
        content: parts[1],
      }
      files.push(file)
      return route.fulfill({ json: { ...file, content: undefined } })
    }
    if (url.pathname === '/drive/v3/files' && request.method() === 'GET') {
      const list = [...files]
        .sort((a, b) => b.createdTime.localeCompare(a.createdTime))
        .map(({ content: _content, ...meta }) => meta)
      return route.fulfill({ json: { files: list } })
    }
    const id = url.pathname.split('/').pop()
    const file = files.find((f) => f.id === id)
    if (request.method() === 'DELETE') {
      if (file) files.splice(files.indexOf(file), 1)
      return route.fulfill({ status: 204, body: '' })
    }
    if (file && url.searchParams.get('alt') === 'media') return route.fulfill({ body: file.content })
    return route.fulfill({ status: 404, json: {} })
  }

  return {
    files,
    /** Live calendar events. */
    calendarEvents: () => [...events.values()].filter((e) => e.status !== 'cancelled'),
    /** Someone adds an event in Google Calendar. */
    addCalendarEvent(summary: string, start: Date, minutes = 30) {
      stamp({
        id: `remote-${++counter}`,
        status: 'confirmed',
        summary,
        start: { dateTime: start.toISOString() },
        end: { dateTime: new Date(start.getTime() + minutes * 60_000).toISOString() },
      })
    },
    async install(context: BrowserContext) {
      await context.route('https://accounts.google.com/gsi/client', (route) =>
        route.fulfill({ contentType: 'text/javascript', body: FAKE_GIS_SCRIPT }),
      )
      await context.route('https://www.googleapis.com/**', handleGoogleApis)
    },
  }
}
