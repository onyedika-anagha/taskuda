import { afterEach, describe, expect, it, vi } from 'vitest'
import { geminiAnswer, jsonResponse, mockFetch, openRouterAnswer } from '@/test/mockFetch'
import { AiRequestError } from './aiErrors'
import { generateWithGemini, testGeminiKey } from './geminiClient'
import { AI_TIMEOUT_MS } from './httpJson'
import { generateWithOpenRouter, testOpenRouterKey } from './openRouterClient'

const KEY = 'test-key-123456'
const PROMPT = { system: 'sys', user: 'usr' }
const RECS = [{ title: 'Batch meetings', detail: 'Put calls back to back.' }]

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('Gemini client', () => {
  it('AC12.6 sends the key only in a header to Google, never in the URL', async () => {
    const { requests } = mockFetch(() => geminiAnswer(RECS))
    await generateWithGemini(KEY, 'gemini-3.5-flash-lite', PROMPT)
    expect(requests).toHaveLength(1)
    const [request] = requests
    expect(new URL(request.url).host).toBe('generativelanguage.googleapis.com')
    expect(request.url).toBe(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent',
    )
    expect(request.url).not.toContain(KEY)
    expect(request.headers['x-goog-api-key']).toBe(KEY)
    expect(request.body).toMatchObject({
      systemInstruction: { parts: [{ text: 'sys' }] },
      contents: [{ role: 'user', parts: [{ text: 'usr' }] }],
      generationConfig: { responseMimeType: 'application/json' },
    })
  })

  it('tests the key by reading the model', async () => {
    const { requests } = mockFetch(() => jsonResponse({ name: 'models/gemini-3.5-flash-lite' }))
    await testGeminiKey(KEY, 'models/gemini-3.5-flash-lite')
    expect(requests[0]).toMatchObject({
      method: 'GET',
      url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite',
    })
  })

  it('refuses model names that could change the URL', async () => {
    const { requests } = mockFetch(() => jsonResponse({}))
    await expect(generateWithGemini(KEY, '../evil?x=', PROMPT)).rejects.toThrow(
      new AiRequestError('model-not-found'),
    )
    expect(requests).toHaveLength(0)
  })

  it.each([
    [400, 'rejected-key'],
    [401, 'rejected-key'],
    [403, 'rejected-key'],
    [404, 'model-not-found'],
    [429, 'rate-limit'],
    [500, 'other'],
  ] as const)('maps HTTP %s to %s', async (status, kind) => {
    mockFetch(() => jsonResponse({ error: {} }, status))
    await expect(generateWithGemini(KEY, 'gemini-3.5-flash-lite', PROMPT)).rejects.toMatchObject({ kind })
  })

  it('maps network failures and empty answers', async () => {
    mockFetch(() => Promise.reject(new TypeError('Failed to fetch')))
    await expect(generateWithGemini(KEY, 'm', PROMPT)).rejects.toMatchObject({ kind: 'network' })
    vi.restoreAllMocks()
    mockFetch(() => jsonResponse({ candidates: [] }))
    await expect(generateWithGemini(KEY, 'm', PROMPT)).rejects.toMatchObject({ kind: 'bad-response' })
  })

  it('times out after 30 seconds', async () => {
    vi.useFakeTimers()
    // A request that never answers; our abort fires at AI_TIMEOUT_MS and fetch then rejects.
    mockFetch(
      () =>
        new Promise((_, reject) => {
          setTimeout(() => reject(new DOMException('Aborted', 'AbortError')), AI_TIMEOUT_MS + 1)
        }),
    )
    const result = generateWithGemini(KEY, 'm', PROMPT).catch((error: unknown) => error)
    await vi.advanceTimersByTimeAsync(AI_TIMEOUT_MS + 2)
    expect(await result).toMatchObject({ kind: 'timeout' })
  })
})

describe('OpenRouter client', () => {
  it('AC12.6 sends the key only as a Bearer token to openrouter.ai', async () => {
    const { requests } = mockFetch(() => openRouterAnswer(RECS))
    const text = await generateWithOpenRouter(KEY, 'openrouter/auto', PROMPT)
    expect(JSON.parse(text)).toEqual({ recommendations: RECS })
    const [request] = requests
    expect(request.url).toBe('https://openrouter.ai/api/v1/chat/completions')
    expect(request.headers.authorization).toBe(`Bearer ${KEY}`)
    expect(request.body).toMatchObject({
      model: 'openrouter/auto',
      messages: [
        { role: 'system', content: 'sys' },
        { role: 'user', content: 'usr' },
      ],
    })
  })

  it('tests the key with GET /key', async () => {
    const { requests } = mockFetch(() => jsonResponse({ data: {} }))
    await testOpenRouterKey(KEY)
    expect(requests[0]).toMatchObject({ method: 'GET', url: 'https://openrouter.ai/api/v1/key' })
  })

  it('maps a rejected key', async () => {
    mockFetch(() => jsonResponse({}, 401))
    await expect(testOpenRouterKey(KEY)).rejects.toMatchObject({ kind: 'rejected-key' })
  })
})
