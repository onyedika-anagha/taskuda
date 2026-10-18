import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { PasswordField } from '@/components/common/PasswordField'
import { ResponsiveDialog } from '@/components/common/ResponsiveDialog'
import { Button } from '@/components/ui/button'
import { unlockSchema, type UnlockValues } from '@/schemas/passphraseForms'
import { WrongPassphraseError } from '@/services/crypto/errors'

interface UnlockDialogProps {
  open: boolean
  onUnlock: (passphrase: string) => Promise<void>
  onCancel: () => void
  /** The way out when the passphrase is forgotten, e.g. "Reset secrets" or "Restore without keys". */
  secondaryLabel: string
  wrongPassphraseHint: string
  onSecondary: () => void
}

/** D5 Unlock: needed on a new device or after restoring a backup. */
export function UnlockDialog({
  open,
  onUnlock,
  onCancel,
  secondaryLabel,
  wrongPassphraseHint,
  onSecondary,
}: UnlockDialogProps) {
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UnlockValues>({
    resolver: zodResolver(unlockSchema),
    defaultValues: { passphrase: '' },
    mode: 'onTouched',
  })

  async function submit(values: UnlockValues) {
    try {
      await onUnlock(values.passphrase)
      reset()
    } catch (error) {
      const message =
        error instanceof WrongPassphraseError
          ? `${error.message} ${wrongPassphraseHint}`
          : 'Couldn’t unlock your keys. Try again.'
      setError('passphrase', { message }, { shouldFocus: true })
    }
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          reset()
          onCancel()
        }
      }}
      title="Enter your passphrase"
      description="Enter your passphrase to unlock your AI key and Jira token."
    >
      <form onSubmit={handleSubmit(submit)} noValidate className="grid gap-4">
        <PasswordField
          id="unlock-passphrase"
          label="Passphrase"
          autoComplete="current-password"
          error={errors.passphrase?.message}
          registration={register('passphrase')}
        />
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="ghost"
            size="lg"
            className="sm:mr-auto"
            onClick={() => {
              reset()
              onSecondary()
            }}
          >
            {secondaryLabel}
          </Button>
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting ? 'Unlocking…' : 'Unlock'}
          </Button>
        </div>
      </form>
    </ResponsiveDialog>
  )
}
