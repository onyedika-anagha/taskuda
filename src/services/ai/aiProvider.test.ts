import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createVault, lockVault, setSecret } from '@/services/crypto/secretVault'
import { VaultLockedError } from '@/services/crypto/errors'
import { db } from '@/services/db/database'
import { makeTask } from '@/test/factories'
import { geminiAnswer, mockFetch, openRouterAnswer } from '@/test/mockFetch'
import { resetVaultState } from '@/test/resetVault'
import { AiNotConfiguredError, getRecommendations, testAiKey } from './aiProvider'
import { setAiModel, setAiProvider } from './aiSettings'

const INPUT = {
  dayKey: '2026-10-19',
  tasks: [makeTask()],
  companiesById: new Map(),
  outcomes: {},
  rating: 4,
  reflection: '',
}
const RECS = [{ title: 'Plan the morning', detail: 'Block 9–11 for deep work.' }]

describe('aiProvider', () => {
  beforeEach(resetVaultState)
  afterEach(() => vi.restoreAllMocks())

  it('needs a provider and a key', async () => {
    await expect(getRecommendations(INPUT)).rejects.toThrow(AiNotConfiguredError)
    await setAiProvider('gemini')
    await expect(getRecommendations(INPUT)).rejects.toThrow(AiNotConfiguredError)
  })

  it('uses the selected provider, its saved model and the decrypted key', async () => {
    await createVault('correct horse battery')
    await setSecret('openrouter', 'or-key')
    await setAiProvider('openrouter')
    await setAiModel('openrouter', 'anthropic/claude-sonnet')
    const { requests } = mockFetch(() => openRouterAnswer(RECS))

    expect(await getRecommendations(INPUT)).toEqual(RECS)
    expect(requests[0].headers.authorization).toBe('Bearer or-key')
    expect(requests[0].body).toMatchObject({ model: 'anthropic/claude-sonnet' })
  })

  it('an empty model falls back to the default', async () => {
    await createVault('correct horse battery')
    await setSecret('gemini', 'g-key')
    await setAiProvider('gemini')
    await setAiModel('gemini', '  ')
    const { requests } = mockFetch(() => geminiAnswer(RECS))
    await getRecommendations(INPUT)
    expect(requests[0].url).toContain('/models/gemini-3.5-flash-lite:generateContent')
  })

  it('reports a locked key instead of calling the provider', async () => {
    await createVault('correct horse battery')
    await setSecret('gemini', 'g-key')
    await setAiProvider('gemini')
    lockVault()
    await db.deviceKeys.clear()
    const { requests } = mockFetch(() => geminiAnswer(RECS))
    await expect(getRecommendations(INPUT)).rejects.toThrow(VaultLockedError)
    expect(requests).toHaveLength(0)
  })

  it('tests the key for one provider', async () => {
    await createVault('correct horse battery')
    await setSecret('gemini', 'g-key')
    const { requests } = mockFetch(() => new Response('{}', { status: 200 }))
    await testAiKey('gemini')
    expect(requests[0].headers['x-goog-api-key']).toBe('g-key')
  })
})
