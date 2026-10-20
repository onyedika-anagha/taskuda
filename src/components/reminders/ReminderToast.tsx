import { BellIcon, XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SNOOZE_MINUTES, type SnoozeMinutes } from '@/types/voice'

interface ReminderToastProps {
  text: string
  onSnooze: (minutes: SnoozeMinutes) => void
  onDone: () => void
  onClose: () => void
}

/**
 * A task reminder that stays until the user acts (PRD AC22.1, AC22.4). Sonner toasts hold only one
 * action, so this is a custom toast. It never takes focus by itself (design DAC18).
 */
export function ReminderToast({ text, onSnooze, onDone, onClose }: ReminderToastProps) {
  return (
    <div className="grid w-full gap-3 rounded-(--radius) border bg-popover p-4 text-sm text-popover-foreground shadow-lg sm:w-(--width)">
      <div className="flex items-start gap-2">
        <BellIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <p className="flex-1 font-medium">{text}</p>
        <Button variant="ghost" size="icon" className="-m-2 size-11" aria-label="Close" onClick={onClose}>
          <XIcon aria-hidden="true" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {SNOOZE_MINUTES.map((minutes) => (
          <Button
            key={minutes}
            variant="outline"
            size="sm"
            className="min-h-11"
            onClick={() => onSnooze(minutes)}
          >
            Snooze {minutes} min
          </Button>
        ))}
        <Button size="sm" className="min-h-11" onClick={onDone}>
          Mark done
        </Button>
      </div>
    </div>
  )
}
