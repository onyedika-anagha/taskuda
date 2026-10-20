import { useId, useState } from 'react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { WEEKDAYS, type Weekday } from '@/types/workday'

const DAY_NAMES: Record<Weekday, string> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
}

interface WeekdayPickerProps {
  /** Accessible name of the group ("Working days", "Repeat on"). */
  label: string
  value: readonly Weekday[]
  onChange: (days: Weekday[]) => void
  /** Shown when the user tries to untick the last day. */
  minimumHint: string
}

/**
 * Seven day toggles, Monday first, that always keep at least one day (design spec Sections 5–7).
 * Letters under 400px, three-letter names above; full names are the accessible names.
 */
export function WeekdayPicker({ label, value, onChange, minimumHint }: WeekdayPickerProps) {
  const hintId = useId()
  const [showHint, setShowHint] = useState(false)
  const wide = useMediaQuery('(min-width: 400px)')

  return (
    // A fieldset names the set of toggles (design spec Section 7); Radix's root has no role.
    <fieldset className="grid gap-2" aria-describedby={showHint ? hintId : undefined}>
      <legend className="sr-only">{label}</legend>
      <ToggleGroup
        type="multiple"
        variant="outline"
        spacing={1}
        className="flex-wrap"
        value={value.map(String)}
        onValueChange={(values) => {
          const days = WEEKDAYS.filter((day) => values.includes(String(day)))
          if (!days.length) {
            setShowHint(true)
            return
          }
          setShowHint(false)
          onChange(days)
        }}
      >
        {WEEKDAYS.map((day) => {
          // The name comes from the text, so it is always the full day and starts with what's shown
          // (WCAG 2.5.3). The rest stays inline at zero size inside one wrapper: `sr-only` text and
          // separate flex items both get a space in the name ("Mon day").
          const name = DAY_NAMES[day]
          const shown = wide ? 3 : 1
          return (
            <ToggleGroupItem key={day} value={String(day)} className="size-11 min-[400px]:w-14">
              <span>
                {name.slice(0, shown)}
                <span className="text-[0px]">{name.slice(shown)}</span>
              </span>
            </ToggleGroupItem>
          )
        })}
      </ToggleGroup>
      <p id={hintId} aria-live="polite" className="min-h-5 text-sm text-muted-foreground">
        {showHint ? minimumHint : ''}
      </p>
    </fieldset>
  )
}
