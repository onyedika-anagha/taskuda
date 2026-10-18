import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { PasswordField } from '@/components/common/PasswordField'
import { ResponsiveDialog } from '@/components/common/ResponsiveDialog'
import { Button } from '@/components/ui/button'
import { changePassphraseSchema, type ChangePassphraseValues } from '@/schemas/passphraseForms'
import { WrongPassphraseError } from '@/services/crypto/errors'
import { useVaultStore } from '@/stores/vaultStore'

interface ChangePassphraseDialogProps {
  open: boolean
  onClose: () => void
}

export function ChangePassphraseDialog({ open, onClose }: ChangePassphraseDialogProps) {
  const changePassphrase = useVaultStore((s) => s.changePassphrase)
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePassphraseValues>({
    resolver: zodResolver(changePassphraseSchema),
    defaultValues: { current: '', next: '', confirm: '' },
    mode: 'onTouched',
  })

  function close() {
    reset()
    onClose()
  }

  async function submit(values: ChangePassphraseValues) {
    try {
      await changePassphrase(values.current, values.next)
      toast.success('Passphrase changed')
      close()
    } catch (error) {
      if (error instanceof WrongPassphraseError) {
        setError('current', { message: error.message }, { shouldFocus: true })
      } else {
        setError('root', { message: 'Couldn’t change the passphrase. Try again.' })
      }
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={(next) => !next && close()} title="Change passphrase">
      <form onSubmit={handleSubmit(submit)} noValidate className="grid gap-4">
        <PasswordField
          id="change-current"
          label="Current passphrase"
          autoComplete="current-password"
          error={errors.current?.message}
          registration={register('current')}
        />
        <PasswordField
          id="change-next"
          label="New passphrase"
          autoComplete="new-password"
          error={errors.next?.message}
          registration={register('next')}
        />
        <PasswordField
          id="change-confirm"
          label="Confirm new passphrase"
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
          <Button type="button" variant="outline" size="lg" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Change passphrase'}
          </Button>
        </div>
      </form>
    </ResponsiveDialog>
  )
}
