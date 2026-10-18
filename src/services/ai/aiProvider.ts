import { getSecret } from '@/services/crypto/secretVault'
import type { AiPrompt, AiProvider, Recommendation } from '@/types/ai'
import { getAiSettings } from './aiSettings'
import { buildRecommendationPrompt, type RecommendationInput } from './buildRecommendationPrompt'
import { generateWithGemini, testGeminiKey } from './geminiClient'
import { generateWithOpenRouter, testOpenRouterKey } from './openRouterClient'
import { parseRecommendations } from './parseRecommendations'

/** One interface over both providers; each sends the key only to its own domain (PRD AC12.6). */
const CLIENTS: Record<
  AiProvider,
  {
    test: (key: string, model: string) => Promise<void>
    generate: (key: string, model: string, prompt: AiPrompt) => Promise<string>
  }
> = {
  gemini: { test: testGeminiKey, generate: generateWithGemini },
  openrouter: { test: (key) => testOpenRouterKey(key), generate: generateWithOpenRouter },
}

export class AiNotConfiguredError extends Error {
  constructor() {
    super('Add an AI key in Settings to get recommendations.')
    this.name = 'AiNotConfiguredError'
  }
}

/** "Test key" in Settings. Rejects with `AiRequestError` when the provider refuses. */
export async function testAiKey(provider: AiProvider): Promise<void> {
  const [key, settings] = await Promise.all([getSecret(provider), getAiSettings()])
  if (!key) throw new AiNotConfiguredError()
  await CLIENTS[provider].test(key, settings.models[provider])
}

/**
 * Closeout recommendations with the user's own key. Throws `AiNotConfiguredError` without a provider/key,
 * `VaultLockedError` when the key is locked, and `AiRequestError` for provider failures.
 */
export async function getRecommendations(input: RecommendationInput): Promise<Recommendation[]> {
  const settings = await getAiSettings()
  const provider = settings.provider
  if (!provider) throw new AiNotConfiguredError()
  const key = await getSecret(provider)
  if (!key) throw new AiNotConfiguredError()
  const text = await CLIENTS[provider].generate(
    key,
    settings.models[provider],
    buildRecommendationPrompt(input),
  )
  return parseRecommendations(text)
}
