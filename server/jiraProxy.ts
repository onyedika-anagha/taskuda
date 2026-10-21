/**
 * Jira proxy (PRD NFR6, AC15.4). Browsers can't call Jira Cloud's REST API directly, so the app
 * sends `{ site, path, method, body }` here with the user's own `Authorization` header and this
 * forwards it — but only to `<site>.atlassian.net`, only for the few endpoints Taskuda uses, only
 * from Taskuda's own origin, and rate limited. Allowed requests are never logged. A refused one
 * logs a single line with the status and reason (never the body or `Authorization`), so abuse
 * shows up in the Vercel function logs (NFR4, security review).
 */

export interface ProxyEnv {
  /** The one origin allowed to call the proxy, e.g. https://taskuda.example.com */
  allowedOrigin: string | undefined
}

export interface ProxyRequestBody {
  site: string
  path: string
  method: 'GET' | 'POST'
  body?: unknown
}

const SITE_PATTERN = /^[a-z0-9][a-z0-9-]{0,62}\.atlassian\.net$/
const ISSUE_KEY = '[A-Z][A-Z0-9_]{0,19}-\\d{1,9}'

/** The only Jira endpoints the app needs, per method. Anything else is refused. */
const ALLOWED: Record<ProxyRequestBody['method'], RegExp[]> = {
  GET: [
    /^\/rest\/api\/3\/myself$/,
    /^\/rest\/api\/3\/status$/,
    new RegExp(`^/rest/api/3/issue/${ISSUE_KEY}\\?fields=summary,status$`),
    new RegExp(`^/rest/api/3/issue/${ISSUE_KEY}/transitions$`),
  ],
  POST: [new RegExp(`^/rest/api/3/issue/${ISSUE_KEY}/transitions$`)],
}

export const MAX_BODY_BYTES = 10_000
export const RATE_LIMIT = { requests: 60, windowMs: 60_000 }
const UPSTREAM_TIMEOUT_MS = 10_000

/**
 * Per-client request counts for the current window. Best effort: serverless instances don't share
 * memory, so this caps bursts per instance rather than globally.
 */
export class RateLimiter {
  private hits = new Map<string, { count: number; windowStart: number }>()

  allow(client: string, now = Date.now()): boolean {
    const entry = this.hits.get(client)
    if (!entry || now - entry.windowStart >= RATE_LIMIT.windowMs) {
      this.hits.set(client, { count: 1, windowStart: now })
      if (this.hits.size > 10_000) this.hits.clear()
      return true
    }
    entry.count++
    return entry.count <= RATE_LIMIT.requests
  }
}

const json = (status: number, error: string) =>
  new Response(JSON.stringify({ error }), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })

/** A refused request: one log line with the reason only. */
function deny(status: number, error: string, reason: string): Response {
  console.warn(`[jira-proxy] refused ${status}: ${reason}`)
  return json(status, error)
}

export function isAllowedTarget(target: Partial<ProxyRequestBody>): target is ProxyRequestBody {
  if (typeof target.site !== 'string' || !SITE_PATTERN.test(target.site.toLowerCase())) return false
  if (target.method !== 'GET' && target.method !== 'POST') return false
  if (typeof target.path !== 'string' || target.path.includes('..')) return false
  return ALLOWED[target.method].some((pattern) => pattern.test(target.path as string))
}

function clientId(request: Request): string {
  return (
    request.headers.get('x-real-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  )
}

export async function handleJiraProxy(
  request: Request,
  env: ProxyEnv,
  limiter: RateLimiter,
  upstreamFetch: typeof fetch = fetch,
): Promise<Response> {
  if (!env.allowedOrigin) return json(500, 'The Jira proxy isn’t configured.')
  if (request.method !== 'POST') return json(405, 'Method not allowed.')
  // Same-origin only: browsers always send Origin on cross-origin and POST requests.
  if (request.headers.get('origin') !== env.allowedOrigin) {
    return deny(403, 'Origin not allowed.', 'origin not allowed')
  }
  if (!limiter.allow(clientId(request))) {
    return deny(429, 'Too many requests. Try again in a minute.', 'rate limit')
  }

  const authorization = request.headers.get('authorization')
  if (!authorization?.startsWith('Basic ')) return deny(401, 'Missing Jira credentials.', 'no credentials')

  // Refuse a declared oversized body before reading it, then check what actually arrived.
  if (Number(request.headers.get('content-length') ?? 0) > MAX_BODY_BYTES) {
    return deny(413, 'Request too large.', 'body too large')
  }
  const raw = await request.text()
  if (raw.length > MAX_BODY_BYTES) return deny(413, 'Request too large.', 'body too large')
  let target: Partial<ProxyRequestBody>
  try {
    target = JSON.parse(raw) as Partial<ProxyRequestBody>
  } catch {
    return deny(400, 'Invalid request.', 'invalid JSON')
  }
  if (!isAllowedTarget(target)) return deny(400, 'That Jira request isn’t allowed.', 'target not allowed')

  let upstream: Response
  try {
    upstream = await upstreamFetch(`https://${target.site.toLowerCase()}${target.path}`, {
      method: target.method,
      headers: {
        Authorization: authorization,
        Accept: 'application/json',
        ...(target.method === 'POST' ? { 'Content-Type': 'application/json' } : {}),
      },
      body: target.method === 'POST' ? JSON.stringify(target.body ?? {}) : undefined,
      redirect: 'error',
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    })
  } catch {
    return json(502, 'Couldn’t reach Jira.')
  }

  // Pass back only the status and body; never Jira's cookies or other headers.
  return new Response(await upstream.text(), {
    status: upstream.status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}
