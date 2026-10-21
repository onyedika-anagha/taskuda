import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { FormField } from '@/components/common/FormField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { companyFormSchema, type CompanyFormValues } from '@/schemas/companyForm'
import { DuplicateCompanyNameError, ValidationError } from '@/services/db/errors'
import { fieldDescribedBy } from '@/utils/formAria'
import { ColorSwatchPicker } from './ColorSwatchPicker'

interface CompanyFormProps {
  defaultValues: CompanyFormValues
  onSubmit: (values: CompanyFormValues) => Promise<void>
  /** No Cancel button when left out (setup puts its own actions under the form). */
  onCancel?: () => void
  /** Clear the form for the next company after a save, keeping focus in Name (design S1b). */
  resetTo?: (saved: CompanyFormValues) => CompanyFormValues
  submitLabel?: string
  cancelLabel?: string
  nameLabel?: string
}

export function CompanyForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  resetTo,
  nameLabel = 'Name',
}: CompanyFormProps) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues,
    mode: 'onTouched',
  })

  async function submit(values: CompanyFormValues) {
    try {
      await onSubmit(values)
      if (resetTo) {
        reset(resetTo(values))
        setFocus('name')
      }
    } catch (error) {
      if (error instanceof DuplicateCompanyNameError || error instanceof ValidationError) {
        setError('name', { message: error.message }, { shouldFocus: true })
        return
      }
      setError('root', { message: 'Couldn’t save the company. Try again.' })
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="grid gap-4">
      <FormField id="company-name" label={nameLabel} error={errors.name?.message}>
        <Input
          id="company-name"
          autoComplete="organization"
          aria-invalid={!!errors.name}
          aria-describedby={fieldDescribedBy('company-name', errors.name?.message)}
          {...register('name')}
        />
      </FormField>

      <Controller
        control={control}
        name="colorId"
        render={({ field }) => (
          <ColorSwatchPicker value={field.value} onChange={field.onChange} legend="Color" />
        )}
      />

      {errors.root?.message ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {errors.root.message}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel ? (
          <Button type="button" variant="outline" size="lg" onClick={onCancel}>
            {cancelLabel}
          </Button>
        ) : null}
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
