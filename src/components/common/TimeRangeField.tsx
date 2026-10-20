import { useId, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { TimeRange } from '@/types/workday'
import { isOvernight } from '@/utils/quietHours'
import { isValidTime } from '@/utils/timeBlocks'

interface TimeRangeFieldProps {
  /** Names the pair for screen readers ("Quiet hours"). */
  legend: string
  value: TimeRange
  /** Called only with a complete, valid range. */
  onChange: (range: TimeRange) => void
}

/** Two labeled times with the "can't be the same" rule and an overnight hint (design spec S7h). */
export function TimeRangeField({ legend, value, onChange }: TimeRangeFieldProps) {
  const id = useId()
  const [draft, setDraft] = useState<TimeRange>(value)
  const [lastValue, setLastValue] = useState<TimeRange>(value)
  // A change saved elsewhere (or a restore) replaces the draft.
  if (value.start !== lastValue.start || value.end !== lastValue.end) {
    setLastValue(value)
    setDraft(value)
  }

  const complete = isValidTime(draft.start) && isValidTime(draft.end)
  const same = complete && draft.start === draft.end
  const messageId = `${id}-message`

  const update = (next: TimeRange) => {
    setDraft(next)
    if (isValidTime(next.start) && isValidTime(next.end) && next.start !== next.end) onChange(next)
  }

  return (
    <fieldset className="grid gap-2" aria-describedby={messageId}>
      <legend className="sr-only">{legend}</legend>
      <div className="flex flex-col gap-3 min-[400px]:flex-row">
        <div className="grid gap-1.5">
          <Label htmlFor={`${id}-start`}>From</Label>
          <Input
            id={`${id}-start`}
            type="time"
            className="min-h-11 w-full min-[400px]:w-36"
            value={draft.start}
            aria-invalid={same || undefined}
            onChange={(event) => update({ ...draft, start: event.target.value })}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`${id}-end`}>To</Label>
          <Input
            id={`${id}-end`}
            type="time"
            className="min-h-11 w-full min-[400px]:w-36"
            value={draft.end}
            aria-invalid={same || undefined}
            onChange={(event) => update({ ...draft, end: event.target.value })}
          />
        </div>
      </div>
      <p
        id={messageId}
        aria-live="polite"
        className={same ? 'text-sm font-medium text-destructive' : 'text-sm text-muted-foreground'}
      >
        {same
          ? 'Start and end can’t be the same.'
          : complete && isOvernight(draft)
            ? 'Runs overnight, into the next morning.'
            : ''}
      </p>
    </fieldset>
  )
}
