import { lockVault } from '@/services/crypto/secretVault'
import { useVaultStore } from '@/stores/vaultStore'
import { resetDatabase } from './resetDatabase'

/** Empty database, nothing unlocked in memory, no prompt open. */
export async function resetVaultState(): Promise<void> {
  lockVault()
  useVaultStore.setState({ status: 'checking', prompt: null })
  await resetDatabase()
}
