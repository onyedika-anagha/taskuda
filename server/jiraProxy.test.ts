import { describe, expect, it, vi } from 'vitest'
import { MAX_BODY_BYTES, RATE_LIMIT, RateLimiter, handleJiraProxy, isAllowedTarget } from './jiraProxy.ts'

const ORIGIN = 'https://taskuda.example.com'
const AUTH = `Basic ${btoa('me@example.com:token')}`

function proxyRequest(target: unknown, headers: Record<string, string> = {}) {
  return new Request('https://taskuda.example.com/api/jira', {
    method: 'POST',
    headers: { origin: ORIGIN, authorization: AUTH, 'x-real-ip': '1.2.3.4', ...headers },
    body: typeof target === 'string' ? target : JSON.stringify(target),
  })
}

const ISSUE = {
  site: 'acme.atlassian.net',
  path: '/rest/api/3/issue/ABC-12?fields=summary,status',
  method: 'GET',
}

function upstream(status = 200, body: unknown = { ok: true }) {
  return vi.fn<typeof fetch>(
    async () =>
      new Response(JSON.stringify(body), {
        status,
        headers: { 'Set-Cookie': 'secret=1', 'X-Internal': 'x' },
      }),
  )
}

describe('Jira proxy (NFR6, AC15.4)', () => {
  it('forwards an allowed request to the Atlassian site with the user’s credentials', async () => {
    const fetchJira = upstream(200, { key: 'ABC-12' })
    const response = await handleJiraProxy(
      proxyRequest(ISSUE),
      { allowedOrigin: ORIGIN },
      new RateLimiter(),
      fetchJira,
    )
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ key: 'ABC-12' })
    const [url, init] = fetchJira.mock.calls[0]
    expect(url).toBe('https://acme.atlassian.net/rest/api/3/issue/ABC-12?fields=summary,status')
    expect(init?.headers).toMatchObject({ Authorization: AUTH })
    expect(init?.redirect).toBe('error')
  })

  it('never passes Jira’s cookies or other headers back', async () => {
    const response = await handleJiraProxy(
      proxyRequest(ISSUE),
      { allowedOrigin: ORIGIN },
      new RateLimiter(),
      upstream(),
    )
    expect(response.headers.get('set-cookie')).toBeNull()
    expect(response.headers.get('x-internal')).toBeNull()
    expect(response.headers.get('cache-control')).toBe('no-store')
  })

  it.each([
    ['another domain', { ...ISSUE, site: 'evil.example.com' }],
    ['a look-alike domain', { ...ISSUE, site: 'acme.atlassian.net.evil.com' }],
    ['an unlisted endpoint', { ...ISSUE, path: '/rest/api/3/user/search?query=a' }],
    ['path traversal', { ...ISSUE, path: '/rest/api/3/issue/ABC-1/../../admin' }],
    ['a different HTTP method', { ...ISSUE, method: 'DELETE' }],
    ['a POST to a read-only endpoint', { ...ISSUE, method: 'POST' }],
  ])('rejects %s', async (_label, target) => {
    const fetchJira = upstream()
    const response = await handleJiraProxy(
      proxyRequest(target),
      { allowedOrigin: ORIGIN },
      new RateLimiter(),
      fetchJira,
    )
    expect(response.status).toBe(400)
    expect(fetchJira).not.toHaveBeenCalled()
  })

  it('rejects other origins and missing credentials', async () => {
    const fetchJira = upstream()
    const env = { allowedOrigin: ORIGIN }
    expect(
      (
        await handleJiraProxy(
          proxyRequest(ISSUE, { origin: 'https://evil.com' }),
          env,
          new RateLimiter(),
          fetchJira,
        )
      ).status,
    ).toBe(403)
    expect(
      (await handleJiraProxy(proxyRequest(ISSUE, { authorization: '' }), env, new RateLimiter(), fetchJira))
        .status,
    ).toBe(401)
    expect(fetchJira).not.toHaveBeenCalled()
  })

  it('refuses to run without a configured origin', async () => {
    const response = await handleJiraProxy(
      proxyRequest(ISSUE),
      { allowedOrigin: undefined },
      new RateLimiter(),
      upstream(),
    )
    expect(response.status).toBe(500)
  })

  it('rejects oversized and malformed bodies', async () => {
    const env = { allowedOrigin: ORIGIN }
    expect(
      (
        await handleJiraProxy(
          proxyRequest('x'.repeat(MAX_BODY_BYTES + 1)),
          env,
          new RateLimiter(),
          upstream(),
        )
      ).status,
    ).toBe(413)
    expect(
      (await handleJiraProxy(proxyRequest('{not json'), env, new RateLimiter(), upstream())).status,
    ).toBe(400)
  })

  it('rate limits each client', async () => {
    const limiter = new RateLimiter()
    const env = { allowedOrigin: ORIGIN }
    for (let i = 0; i < RATE_LIMIT.requests; i++) {
      expect((await handleJiraProxy(proxyRequest(ISSUE), env, limiter, upstream())).status).toBe(200)
    }
    expect((await handleJiraProxy(proxyRequest(ISSUE), env, limiter, upstream())).status).toBe(429)
    // Another client isn't affected, and the window resets.
    expect(
      (await handleJiraProxy(proxyRequest(ISSUE, { 'x-real-ip': '5.6.7.8' }), env, limiter, upstream()))
        .status,
    ).toBe(200)
    expect(limiter.allow('1.2.3.4', Date.now() + RATE_LIMIT.windowMs)).toBe(true)
  })

  it('reports an unreachable Jira as 502', async () => {
    const failing = vi.fn<typeof fetch>(async () => {
      throw new TypeError('fetch failed')
    })
    expect(
      (await handleJiraProxy(proxyRequest(ISSUE), { allowedOrigin: ORIGIN }, new RateLimiter(), failing))
        .status,
    ).toBe(502)
  })

  it('never logs requests (no tokens in logs)', async () => {
    const log = vi.spyOn(console, 'log')
    const error = vi.spyOn(console, 'error')
    await handleJiraProxy(proxyRequest(ISSUE), { allowedOrigin: ORIGIN }, new RateLimiter(), upstream())
    await handleJiraProxy(
      proxyRequest({ ...ISSUE, site: 'evil.com' }),
      { allowedOrigin: ORIGIN },
      new RateLimiter(),
      upstream(),
    )
    expect(log).not.toHaveBeenCalled()
    expect(error).not.toHaveBeenCalled()
  })

  it('allows only the endpoints Taskuda uses', () => {
    const ok = (path: string, method = 'GET') =>
      isAllowedTarget({ site: 'acme.atlassian.net', path, method: method as 'GET' })
    expect(ok('/rest/api/3/myself')).toBe(true)
    expect(ok('/rest/api/3/status')).toBe(true)
    expect(ok('/rest/api/3/issue/PROJ_X-99/transitions')).toBe(true)
    expect(ok('/rest/api/3/issue/PROJ-99/transitions', 'POST')).toBe(true)
    expect(ok('/rest/api/3/issue/proj-99?fields=summary,status')).toBe(false)
    expect(ok('/rest/api/2/myself')).toBe(false)
  })
})
