import { useState } from 'react'
import { AI_ERROR_REASONS, AiRequestError } from '@/services/ai/aiErrors'
import { AiNotConfiguredError, testAiKey } from '@/services/ai/aiProvider'
import { VaultLockedError } from '@/services/crypto/errors'
import { useVaultStore } from '@/stores/vaultStore'
import { AI_PROVIDER_LABELS, type AiProvider } from '@/types/ai'

export type TestKeyResult =
  { state: 'idle' } | { state: 'testing' } | { state: 'ok' } | { state: 'failed'; message: string }

function messageFor(provider: AiProvider, error: unknown): string {
  const name = AI_PROVIDER_LABELS[provider]
  if (error instanceof AiNotConfiguredError) return 'Save a key first.'
  if (error instanceof AiRequestError && error.kind === 'rejected-key') return `${name} rejected this key.`
  if (error instanceof AiRequestError) return `Couldn’t test the key: ${AI_ERROR_REASONS[error.kind]}.`
  return 'Couldn’t test the key. Try again.'
}

/** "Test key" in AI settings (design F10.3). */
export function useTestAiKey(provider: AiProvider) {
  const [result, setResult] = useState<TestKeyResult>({ state: 'idle' })
  const ensureUnlocked = useVaultStore((s) => s.ensureUnlocked)

  async function test() {
    setResult({ state: 'testing' })
    try {
      await testAiKey(provider)
      setResult({ state: 'ok' })
    } catch (error) {
      if (error instanceof VaultLockedError && (await ensureUnlocked())) return test()
      setResult({ state: 'failed', message: messageFor(provider, error) })
    }
  }

  return { result, test, reset: () => setResult({ state: 'idle' }) }
}
