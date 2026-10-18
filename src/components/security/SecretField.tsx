import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { PasswordField } from '@/components/common/PasswordField'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useSecretHint } from '@/hooks/useSecretHint'
import { secretValueSchema, type SecretValueValues } from '@/schemas/passphraseForms'
import { ValidationError } from '@/services/db/errors'
import { useVaultStore } from '@/stores/vaultStore'
import type { SecretName } from '@/types/vault'

interface SecretFieldProps {
  name: SecretName
  label: string
  /** Shown in the remove confirmation, e.g. "Gemini key". */
  itemName: string
}

/**
 * Enter, replace or remove one secret. After saving, only the last 4 characters are ever shown (DAC14),
 * and the input is cleared so the key isn't left in the page.
 */
export function SecretField({ name, label, itemName }: SecretFieldProps) {
  const hint = useSecretHint(name)
  const saveSecret = useVaultStore((s) => s.saveSecret)
  const removeSecret = useVaultStore((s) => s.removeSecret)
  const ensureUnlocked = useVaultStore((s) => s.ensureUnlocked)
  const [replacing, setReplacing] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const id = `secret-${name}`

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SecretValueValues>({
    resolver: zodResolver(secretValueSchema),
    defaultValues: { value: '' },
    mode: 'onTouched',
  })

  async function submit({ value }: SecretValueValues) {
    try {
      const saved = await saveSecret(name, value)
      if (!saved) return
      reset()
      setReplacing(false)
      toast.success(`${itemName} saved`)
    } catch (error) {
      setError('value', {
        message:
          error instanceof ValidationError ? error.message : `Couldn’t save the ${itemName}. Try again.`,
      })
    }
  }

  if (hint.state === 'loading') return <Skeleton className="h-16 w-full" />

  if (hint.state === 'locked' && !replacing) {
    return (
      <div className="grid gap-1.5">
        <p className="text-sm font-medium">{label}</p>
        <div className="flex flex-wrap items-center gap-2">
          <p className="flex-1 text-sm text-muted-foreground">Saved and locked on this device.</p>
          <Button variant="outline" className="min-h-11" onClick={() => void ensureUnlocked()}>
            Unlock
          </Button>
        </div>
      </div>
    )
  }

  if (hint.state === 'saved' && !replacing) {
    return (
      <div className="grid gap-1.5">
        <p className="text-sm font-medium">{label}</p>
        <div className="flex flex-wrap items-center gap-2">
          <p className="flex-1 font-mono text-sm">
            <span aria-hidden="true">{hint.masked}</span>
            <span className="sr-only">{`Saved ${itemName} ending in ${hint.masked.slice(-4)}`}</span>
          </p>
          <Button variant="outline" className="min-h-11" onClick={() => setReplacing(true)}>
            Replace
          </Button>
          <Button variant="destructive" className="min-h-11" onClick={() => setConfirmRemove(true)}>
            Remove
          </Button>
        </div>
        <ConfirmDialog
          open={confirmRemove}
          title={`Remove your ${itemName}?`}
          description="It will be deleted from this device and from your next backup."
          confirmLabel="Remove"
          destructive
          onCancel={() => setConfirmRemove(false)}
          onConfirm={() => {
            setConfirmRemove(false)
            void removeSecret(name).then(() => toast.success(`${itemName} removed`))
          }}
        />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="grid gap-2">
      <PasswordField
        id={id}
        label={label}
        autoComplete="off"
        error={errors.value?.message}
        registration={register('value')}
      />
      <div className="flex gap-2">
        <Button type="submit" className="min-h-11" disabled={isSubmitting}>
          Save
        </Button>
        {replacing ? (
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            onClick={() => {
              reset()
              setReplacing(false)
            }}
          >
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  )
}
