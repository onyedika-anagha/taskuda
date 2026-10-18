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
 * Fake Google sign-in plus an in-memory Drive app-data folder. Share one instance between
 * browser contexts to act out "back up on device A, restore on device B".
 */
export function createFakeGoogle() {
  const files: StoredFile[] = []
  let counter = 0

  async function handleDrive(route: Route) {
    const request = route.request()
    const url = new URL(request.url())
    if (request.headers().authorization !== 'Bearer e2e-token')
      return route.fulfill({ status: 401, json: {} })

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
    async install(context: BrowserContext) {
      await context.route('https://accounts.google.com/gsi/client', (route) =>
        route.fulfill({ contentType: 'text/javascript', body: FAKE_GIS_SCRIPT }),
      )
      await context.route('https://www.googleapis.com/**', handleDrive)
    },
  }
}
