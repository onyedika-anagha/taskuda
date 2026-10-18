import { getSetting, setSetting } from '@/services/db/settingsRepository'
import type { AiProvider, AiSettings } from '@/types/ai'
import { DEFAULT_MODELS } from '@/types/ai'

const KEYS = {
  provider: 'ai.provider',
  model: (provider: AiProvider) => `ai.model.${provider}`,
  disclosure: (provider: AiProvider) => `ai.disclosureAccepted.${provider}`,
}

export async function getAiSettings(): Promise<AiSettings> {
  const [provider, geminiModel, openrouterModel, geminiOk, openrouterOk] = await Promise.all([
    getSetting<AiProvider | null>(KEYS.provider, null),
    getSetting(KEYS.model('gemini'), DEFAULT_MODELS.gemini),
    getSetting(KEYS.model('openrouter'), DEFAULT_MODELS.openrouter),
    getSetting(KEYS.disclosure('gemini'), false),
    getSetting(KEYS.disclosure('openrouter'), false),
  ])
  return {
    provider,
    models: { gemini: geminiModel, openrouter: openrouterModel },
    disclosureAccepted: { gemini: geminiOk, openrouter: openrouterOk },
  }
}

export const setAiProvider = (provider: AiProvider) => setSetting(KEYS.provider, provider)

export function setAiModel(provider: AiProvider, model: string): Promise<void> {
  return setSetting(KEYS.model(provider), model.trim() || DEFAULT_MODELS[provider])
}

export const acceptDisclosure = (provider: AiProvider) => setSetting(KEYS.disclosure(provider), true)
