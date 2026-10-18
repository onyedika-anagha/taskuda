import type { UseFormRegisterReturn } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { fieldDescribedBy } from '@/utils/formAria'
import { FormField } from './FormField'

interface PasswordFieldProps {
  id: string
  label: string
  error?: string
  hint?: string
  autoComplete: 'current-password' | 'new-password' | 'off'
  registration: UseFormRegisterReturn
}

export function PasswordField({ id, label, error, hint, autoComplete, registration }: PasswordFieldProps) {
  return (
    <FormField id={id} label={label} error={error} hint={hint}>
      <Input
        id={id}
        type="password"
        autoComplete={autoComplete}
        spellCheck={false}
        aria-invalid={!!error}
        aria-describedby={fieldDescribedBy(id, error, hint)}
        {...registration}
      />
    </FormField>
  )
}
