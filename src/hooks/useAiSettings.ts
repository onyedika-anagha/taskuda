import { useLiveQuery } from 'dexie-react-hooks'
import { getAiSettings } from '@/services/ai/aiSettings'
import { listSecretNames } from '@/services/crypto/secretVault'
import type { AiProvider, AiSettings } from '@/types/ai'

export interface AiSettingsView extends AiSettings {
  /** Providers with a saved (encrypted) key. */
  keys: Partial<Record<AiProvider, boolean>>
}

/** `undefined` while loading. Updates when settings or saved keys change. */
export function useAiSettings(): AiSettingsView | undefined {
  return useLiveQuery(async () => {
    const [settings, names] = await Promise.all([getAiSettings(), listSecretNames()])
    return {
      ...settings,
      keys: { gemini: names.includes('gemini'), openrouter: names.includes('openrouter') },
    }
  }, [])
}
