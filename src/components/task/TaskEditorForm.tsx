import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { FormField } from '@/components/common/FormField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { NO_COMPANY, taskFormSchema, type TaskFormValues } from '@/schemas/taskForm'
import type { Company } from '@/types/company'
import { TIME_BLOCKS } from '@/types/task'
import { JiraIssueField } from './JiraIssueField'
import { BLOCK_LABELS } from '@/utils/taskPresentation'
import { fieldDescribedBy } from '@/utils/formAria'
import { blockForTime, isValidTime } from '@/utils/timeBlocks'

interface TaskEditorFormProps {
  defaultValues: TaskFormValues
  companies: Company[]
  isEdit: boolean
  onSubmit: (values: TaskFormValues) => Promise<void>
  onCancel: () => void
  onDelete?: () => void
}

export function TaskEditorForm({
  defaultValues,
  companies,
  isEdit,
  onSubmit,
  onCancel,
  onDelete,
}: TaskEditorFormProps) {
  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues,
    // Validate on blur first, then as the user fixes the field (DAC6).
    mode: 'onTouched',
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4">
      <FormField id="task-title" label="Title" error={errors.title?.message}>
        <Input
          id="task-title"
          autoComplete="off"
          aria-invalid={!!errors.title}
          aria-describedby={fieldDescribedBy('task-title', errors.title?.message)}
          {...register('title')}
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="task-company" label="Company">
          <Controller
            control={control}
            name="companyId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="task-company" className="w-full" onBlur={field.onBlur}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_COMPANY}>No company</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>

        <FormField id="task-block" label="Time of day">
          <Controller
            control={control}
            name="block"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="task-block" className="w-full" onBlur={field.onBlur}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_BLOCKS.map((block) => (
                    <SelectItem key={block} value={block}>
                      {BLOCK_LABELS[block]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>

        <FormField id="task-start" label="Start time (optional)" error={errors.startTime?.message}>
          <Input
            id="task-start"
            type="time"
            aria-invalid={!!errors.startTime}
            aria-describedby={fieldDescribedBy('task-start', errors.startTime?.message)}
            {...register('startTime', {
              // Setting a start time puts the task in the matching block (design F2.4).
              onChange: (event: { target: { value: string } }) => {
                const time = event.target.value
                if (time && isValidTime(time)) setValue('block', blockForTime(time))
              },
            })}
          />
        </FormField>

        <FormField
          id="task-duration"
          label="Duration in minutes (optional)"
          error={errors.durationMinutes?.message}
        >
          <Input
            id="task-duration"
            inputMode="numeric"
            autoComplete="off"
            aria-invalid={!!errors.durationMinutes}
            aria-describedby={fieldDescribedBy('task-duration', errors.durationMinutes?.message)}
            {...register('durationMinutes')}
          />
        </FormField>
      </div>

      <FormField id="task-notes" label="Notes (optional)" error={errors.notes?.message}>
        <Textarea
          id="task-notes"
          rows={3}
          aria-invalid={!!errors.notes}
          aria-describedby={fieldDescribedBy('task-notes', errors.notes?.message)}
          {...register('notes')}
        />
      </FormField>

      <Controller
        control={control}
        name="jiraIssue"
        render={({ field }) => <JiraIssueField value={field.value} onChange={field.onChange} />}
      />

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
        {isEdit && onDelete ? (
          <Button type="button" variant="destructive" size="lg" onClick={onDelete} className="sm:mr-auto">
            Delete task
          </Button>
        ) : null}
        <Button type="button" variant="outline" size="lg" onClick={onCancel} className="sm:ml-auto">
          Cancel
        </Button>
        <Button type="submit" size="lg" disabled={isSubmitting}>
          Save
        </Button>
      </div>
    </form>
  )
}
