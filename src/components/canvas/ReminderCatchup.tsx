import { format } from 'date-fns'
import { BellIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useReminderStore } from '@/stores/reminderStore'

/** Reminders that came due while Taskuda was in the background or closed (PRD AC9.5, design F11.2). */
export function ReminderCatchup() {
  const missed = useReminderStore((s) => s.missed)
  const dismiss = useReminderStore((s) => s.dismissMissed)
  if (missed.length === 0) return null

  const count = missed.length === 1 ? 'a reminder' : `${missed.length} reminders`
  return (
    <section aria-labelledby="catchup-heading" className="grid gap-2 rounded-lg border bg-card p-4">
      <div className="flex items-start gap-2">
        <BellIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <h2 id="catchup-heading" className="flex-1 text-sm font-medium">
          You missed {count} while Taskuda was in the background.
        </h2>
        <Button variant="ghost" size="sm" className="min-h-11" onClick={dismiss}>
          Dismiss
        </Button>
      </div>
      <ul className="grid gap-1 pl-6 text-sm">
        {missed.map((reminder) => (
          <li key={reminder.id}>
            <span className="text-muted-foreground tabular-nums">{format(reminder.at, 'h:mm a')}</span> ·{' '}
            {reminder.text}
          </li>
        ))}
      </ul>
    </section>
  )
}
