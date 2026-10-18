import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useVaultStore } from '@/stores/vaultStore'
import { ResetSecretsDialog } from './ResetSecretsDialog'
import { SetPassphraseDialog } from './SetPassphraseDialog'
import { UnlockDialog } from './UnlockDialog'

/** App-wide passphrase dialogs, opened by `useVaultStore().ensureUnlocked()`. Render once. */
export function VaultPrompts() {
  const prompt = useVaultStore((s) => s.prompt)
  const refresh = useVaultStore((s) => s.refresh)
  const finishPrompt = useVaultStore((s) => s.finishPrompt)
  const createVault = useVaultStore((s) => s.createVault)
  const unlock = useVaultStore((s) => s.unlock)
  const resetSecrets = useVaultStore((s) => s.resetSecrets)
  const [confirmReset, setConfirmReset] = useState(false)

  useEffect(() => {
    void refresh()
  }, [refresh])

  return (
    <>
      <SetPassphraseDialog
        open={prompt === 'set-passphrase'}
        onSubmit={async (passphrase) => {
          await createVault(passphrase)
          finishPrompt(true)
        }}
        onCancel={() => finishPrompt(false)}
      />
      <UnlockDialog
        open={prompt === 'unlock' && !confirmReset}
        onUnlock={async (passphrase) => {
          await unlock(passphrase)
          finishPrompt(true)
        }}
        onCancel={() => finishPrompt(false)}
        secondaryLabel="Forgot it? Reset secrets"
        wrongPassphraseHint="Try again, or reset your secrets and add your keys again."
        onSecondary={() => setConfirmReset(true)}
      />
      <ResetSecretsDialog
        open={confirmReset}
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          setConfirmReset(false)
          void resetSecrets().then(() => {
            finishPrompt(false)
            toast.success('Secrets reset. Add your keys again when you need them.')
          })
        }}
      />
    </>
  )
}
