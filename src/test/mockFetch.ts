import { vi } from 'vitest'

export interface RecordedRequest {
  url: string
  method: string
  headers: Record<string, string>
  /** Parsed JSON body, when the body is JSON. */
  body: unknown
  rawBody: string | undefined
}

function tryParseJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

type Responder = (request: RecordedRequest) => Response | Promise<Response>

/** Replaces `fetch`, records every request (to check where keys go) and answers with `respond`. */
export function mockFetch(respond: Responder) {
  const requests: RecordedRequest[] = []
  const spy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const headers = Object.fromEntries(new Headers(init?.headers).entries())
    const request: RecordedRequest = {
      url: String(input),
      method: init?.method ?? 'GET',
      headers,
      body: typeof init?.body === 'string' ? tryParseJson(init.body) : undefined,
      rawBody: typeof init?.body === 'string' ? init.body : undefined,
    }
    requests.push(request)
    return respond(request)
  })
  return { requests, spy }
}

export const jsonResponse = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })

export const geminiAnswer = (recommendations: { title: string; detail: string }[]) =>
  jsonResponse({ candidates: [{ content: { parts: [{ text: JSON.stringify({ recommendations }) }] } }] })

export const openRouterAnswer = (recommendations: { title: string; detail: string }[]) =>
  jsonResponse({ choices: [{ message: { content: JSON.stringify({ recommendations }) } }] })
