import { LockIcon, ShieldCheckIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { ChangePassphraseDialog } from '@/components/security/ChangePassphraseDialog'
import { ResetSecretsDialog } from '@/components/security/ResetSecretsDialog'
import { Button } from '@/components/ui/button'
import { useVaultStore } from '@/stores/vaultStore'

const STATUS_COPY = {
  checking: 'Checking…',
  none: 'No passphrase yet. You’ll set one when you save your first key.',
  locked: 'Your keys are locked on this device. Unlock them with your passphrase.',
  unlocked: 'Your keys are encrypted and unlocked on this device.',
} as const

/** Passphrase status, change and reset (design S7d, "Security"). */
export function SecurityPanel() {
  const status = useVaultStore((s) => s.status)
  const ensureUnlocked = useVaultStore((s) => s.ensureUnlocked)
  const resetSecrets = useVaultStore((s) => s.resetSecrets)
  const [changing, setChanging] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const Icon = status === 'unlocked' ? ShieldCheckIcon : LockIcon

  return (
    <section aria-labelledby="security-heading" className="grid gap-3 rounded-lg border bg-card p-4">
      <h3 id="security-heading" className="font-semibold">
        Security
      </h3>
      <p className="flex items-start gap-2 text-sm">
        <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        {STATUS_COPY[status]}
      </p>
      {status === 'locked' || status === 'unlocked' ? (
        <div className="flex flex-wrap gap-2">
          {status === 'locked' ? (
            <Button className="min-h-11" onClick={() => void ensureUnlocked()}>
              Unlock
            </Button>
          ) : (
            <Button variant="outline" className="min-h-11" onClick={() => setChanging(true)}>
              Change passphrase
            </Button>
          )}
          <Button variant="destructive" className="min-h-11" onClick={() => setConfirmReset(true)}>
            Reset secrets
          </Button>
        </div>
      ) : null}
      <ChangePassphraseDialog open={changing} onClose={() => setChanging(false)} />
      <ResetSecretsDialog
        open={confirmReset}
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          setConfirmReset(false)
          void resetSecrets().then(() => toast.success('Secrets reset'))
        }}
      />
    </section>
  )
}
