import { cn } from '@/lib/utils'
import type { TaskOutcome } from '@/types/closeout'

const OPTIONS: [TaskOutcome, string][] = [
  ['carry_over', 'Carry over'],
  ['delete', 'Delete'],
]

interface OutcomeChooserProps {
  taskId: string
  value: TaskOutcome | undefined
  onChange: (outcome: TaskOutcome) => void
}

/** Per-task "Carry over" / "Delete" choice; both are explicit, nothing is dropped silently (PRD AC10.1). */
export function OutcomeChooser({ taskId, value, onChange }: OutcomeChooserProps) {
  return (
    <div className="inline-flex rounded-lg bg-muted p-1">
      {OPTIONS.map(([outcome, label]) => (
        <label
          key={outcome}
          className={cn(
            'flex min-h-11 cursor-pointer items-center rounded-md px-3 text-sm font-medium',
            'has-focus-visible:ring-2 has-focus-visible:ring-ring',
            value === outcome
              ? outcome === 'delete'
                ? 'bg-background text-destructive shadow-sm'
                : 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground',
          )}
        >
          <input
            type="radio"
            name={`outcome-${taskId}`}
            value={outcome}
            checked={value === outcome}
            onChange={() => onChange(outcome)}
            className="sr-only"
          />
          {label}
        </label>
      ))}
    </div>
  )
}
