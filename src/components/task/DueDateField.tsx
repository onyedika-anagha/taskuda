import { PlusIcon } from 'lucide-react'
import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import { FormField } from '@/components/common/FormField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ADD_DUE_DATE_ID, DUE_DATE_INPUT_ID, type useDueDateField } from '@/hooks/useDueDateField'
import type { TaskFormValues } from '@/schemas/taskForm'
import { fieldDescribedBy } from '@/utils/formAria'

const PASSED_HINT = 'This date has passed. The task will show as overdue.'
const REPEATING_TEXT = 'Repeating tasks don’t have due dates.'

interface DueDateFieldProps {
  due: ReturnType<typeof useDueDateField>
  register: UseFormRegister<TaskFormValues>
  errors: FieldErrors<TaskFormValues>
}

/** S3 Due date (PRD FR30, design F18): "+ Add due date", then date, optional time and Remove. */
export function DueDateField({ due, register, errors }: DueDateFieldProps) {
  if (due.repeating) {
    return (
      <p className="text-sm text-muted-foreground">
        {due.droppedForRepeat ? `Due date removed. ${REPEATING_TEXT}` : REPEATING_TEXT}
      </p>
    )
  }

  if (!due.opened) {
    return (
      <Button
        id={ADD_DUE_DATE_ID}
        type="button"
        variant="ghost"
        className="min-h-11 justify-self-start px-2"
        onClick={due.open}
      >
        <PlusIcon aria-hidden="true" />
        Add due date
      </Button>
    )
  }

  const dateError = errors.dueDate?.message
  const timeError = errors.dueTime?.message
  const hint = due.passed ? PASSED_HINT : undefined

  return (
    <div className="grid gap-2">
      <div className="grid gap-4 min-[400px]:grid-cols-2">
        <FormField id={DUE_DATE_INPUT_ID} label="Due date" error={dateError} hint={hint}>
          <Input
            id={DUE_DATE_INPUT_ID}
            type="date"
            aria-invalid={!!dateError}
            aria-describedby={fieldDescribedBy(DUE_DATE_INPUT_ID, dateError, hint)}
            {...register('dueDate')}
          />
        </FormField>
        <FormField id="task-due-time" label="Due time (optional)" error={timeError}>
          <Input
            id="task-due-time"
            type="time"
            aria-invalid={!!timeError}
            aria-describedby={fieldDescribedBy('task-due-time', timeError)}
            {...register('dueTime')}
          />
        </FormField>
      </div>
      <Button type="button" variant="ghost" className="min-h-11 justify-self-start px-2" onClick={due.remove}>
        Remove due date
      </Button>
    </div>
  )
}
