import type { AppDataFile } from '@/services/google/driveAppData'
import { jsonResponse, mockFetch, type RecordedRequest } from './mockFetch'

interface StoredFile extends AppDataFile {
  content: string
}

/** Parses our multipart upload body into its metadata and content parts. */
function parseMultipart(body: string): { metadata: Record<string, unknown>; content: string } {
  const boundary = body.split('\r\n')[0]
  const parts = body
    .split(boundary)
    .slice(1, -1)
    .map((part) => part.split('\r\n\r\n').slice(1).join('\r\n\r\n').replace(/\r\n$/, ''))
  return { metadata: JSON.parse(parts[0]), content: parts[1] }
}

/**
 * In-memory Drive app-data folder behind a mocked `fetch`. Records requests so tests can check
 * scopes, folders and auth headers. `failNext` makes the next call fail with that status.
 */
export function installFakeDrive() {
  const files: StoredFile[] = []
  const state = { failNext: 0 as number }
  let counter = 0
  const { requests, spy } = mockFetch(async (request: RecordedRequest) => {
    if (state.failNext) {
      const status = state.failNext
      state.failNext = 0
      return jsonResponse({ error: { code: status } }, status)
    }
    const url = new URL(request.url)
    if (url.pathname === '/upload/drive/v3/files' && request.method === 'POST') {
      const { metadata, content } = parseMultipart(request.rawBody ?? '')
      const file: StoredFile = {
        id: `file-${++counter}`,
        name: String(metadata.name),
        createdTime: new Date(Date.now() + counter).toISOString(),
        appProperties: metadata.appProperties as Record<string, string>,
        content,
      }
      files.push(file)
      return jsonResponse(file)
    }
    if (url.pathname === '/drive/v3/files' && request.method === 'GET') {
      const sorted = [...files].sort((a, b) => b.createdTime.localeCompare(a.createdTime))
      return jsonResponse({ files: sorted.map(({ content: _content, ...meta }) => meta) })
    }
    const id = decodeURIComponent(url.pathname.split('/').pop() ?? '')
    const index = files.findIndex((f) => f.id === id)
    if (request.method === 'DELETE') {
      if (index >= 0) files.splice(index, 1)
      return new Response(null, { status: index >= 0 ? 204 : 404 })
    }
    if (url.searchParams.get('alt') === 'media') {
      return index >= 0 ? new Response(files[index].content, { status: 200 }) : jsonResponse({}, 404)
    }
    return jsonResponse({}, 404)
  })
  return { files, requests, spy, state }
}
