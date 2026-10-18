import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { PasswordField } from '@/components/common/PasswordField'
import { ResponsiveDialog } from '@/components/common/ResponsiveDialog'
import { Button } from '@/components/ui/button'
import { setPassphraseSchema, type SetPassphraseValues } from '@/schemas/passphraseForms'

interface SetPassphraseDialogProps {
  open: boolean
  onSubmit: (passphrase: string) => Promise<void>
  onCancel: () => void
}

/** D6 Set Passphrase: shown before the first secret is saved on a device. */
export function SetPassphraseDialog({ open, onSubmit, onCancel }: SetPassphraseDialogProps) {
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SetPassphraseValues>({
    resolver: zodResolver(setPassphraseSchema),
    defaultValues: { passphrase: '', confirm: '' },
    mode: 'onTouched',
  })

  async function submit(values: SetPassphraseValues) {
    try {
      await onSubmit(values.passphrase)
      reset()
    } catch {
      setError('root', { message: 'Couldn’t save the passphrase. Try again.' })
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
      title="Set a passphrase"
      description="It protects your AI key and Jira token, including in your Drive backup. You’ll only need it on a new device. If you forget it, you’ll need to add your keys again — nothing else is lost."
    >
      <form onSubmit={handleSubmit(submit)} noValidate className="grid gap-4">
        <PasswordField
          id="set-passphrase"
          label="Passphrase"
          autoComplete="new-password"
          error={errors.passphrase?.message}
          registration={register('passphrase')}
        />
        <PasswordField
          id="set-passphrase-confirm"
          label="Confirm passphrase"
          autoComplete="new-password"
          error={errors.confirm?.message}
          registration={register('confirm')}
        />
        {errors.root?.message ? (
          <p role="alert" className="text-sm font-medium text-destructive">
            {errors.root.message}
          </p>
        ) : null}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => {
              reset()
              onCancel()
            }}
          >
            Cancel
          </Button>
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Set passphrase'}
          </Button>
        </div>
      </form>
    </ResponsiveDialog>
  )
}
