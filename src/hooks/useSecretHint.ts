import { useLiveQuery } from 'dexie-react-hooks'
import { getSecret, listSecretNames } from '@/services/crypto/secretVault'
import { useVaultStore } from '@/stores/vaultStore'
import type { SecretName } from '@/types/vault'

export type SecretHint =
  | { state: 'loading' }
  | { state: 'missing' }
  /** Saved but the vault is locked on this device, so even the last 4 characters can't be shown. */
  | { state: 'locked' }
  | { state: 'saved'; masked: string }

const MASK = '••••••••'

/** Masked display for a saved secret: only the last 4 characters, never the full value (DAC14). */
export function maskSecret(value: string): string {
  return `${MASK}${value.slice(-4)}`
}

export function useSecretHint(name: SecretName): SecretHint {
  const status = useVaultStore((s) => s.status)
  const hint = useLiveQuery(async (): Promise<SecretHint> => {
    if (!(await listSecretNames()).includes(name)) return { state: 'missing' }
    if (status !== 'unlocked') return { state: 'locked' }
    const value = await getSecret(name)
    return value ? { state: 'saved', masked: maskSecret(value) } : { state: 'missing' }
  }, [name, status])
  return status === 'checking' || !hint ? { state: 'loading' } : hint
}
