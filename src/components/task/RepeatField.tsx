import { Controller, useWatch, type Control } from 'react-hook-form'
import { FormField } from '@/components/common/FormField'
import { WeekdayPicker } from '@/components/common/WeekdayPicker'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { RepeatOption, TaskFormValues } from '@/schemas/taskForm'
import type { Weekday } from '@/types/workday'
import { fieldDescribedBy } from '@/utils/formAria'

const REPEAT_LABELS: Record<RepeatOption, string> = {
  none: 'Doesn’t repeat',
  daily: 'Every day',
  working_days: 'Every working day',
  weekly: 'Weekly',
  monthly: 'Monthly',
}

const DAYS_OF_MONTH = Array.from({ length: 31 }, (_, i) => String(i + 1))
const SHORT_MONTH_HINT = 'In shorter months, it moves to the last day.'

interface RepeatFieldProps {
  control: Control<TaskFormValues>
  weekdaysError?: string
}

/** S3 Repeat (PRD AC20.1, design F14): the select, plus Repeat on (Weekly) or On day (Monthly). */
export function RepeatField({ control, weekdaysError }: RepeatFieldProps) {
  const [repeat, repeatDay] = useWatch({ control, name: ['repeat', 'repeatDay'] })

  return (
    <div className="grid gap-3">
      <FormField id="task-repeat" label="Repeat">
        <Controller
          control={control}
          name="repeat"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="task-repeat" className="w-full" onBlur={field.onBlur}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(REPEAT_LABELS) as RepeatOption[]).map((option) => (
                  <SelectItem key={option} value={option}>
                    {REPEAT_LABELS[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </FormField>

      {repeat === 'weekly' ? (
        <div className="grid gap-1.5">
          <p className="text-sm font-medium" aria-hidden="true">
            Repeat on
          </p>
          <Controller
            control={control}
            name="repeatWeekdays"
            render={({ field }) => (
              <WeekdayPicker
                label="Repeat on"
                value={field.value as Weekday[]}
                onChange={field.onChange}
                minimumHint="Pick at least one day."
              />
            )}
          />
          {weekdaysError ? <p className="text-xs font-medium text-destructive">{weekdaysError}</p> : null}
        </div>
      ) : null}

      {repeat === 'monthly' ? (
        <FormField
          id="task-repeat-day"
          label="On day"
          hint={Number(repeatDay) >= 29 ? SHORT_MONTH_HINT : undefined}
        >
          <Controller
            control={control}
            name="repeatDay"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id="task-repeat-day"
                  className="w-full sm:w-32"
                  aria-describedby={fieldDescribedBy(
                    'task-repeat-day',
                    undefined,
                    Number(field.value) >= 29 ? SHORT_MONTH_HINT : undefined,
                  )}
                  onBlur={field.onBlur}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_MONTH.map((day) => (
                    <SelectItem key={day} value={day}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>
      ) : null}
    </div>
  )
}
