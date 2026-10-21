import { BellIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SNOOZE_MINUTES, type SnoozeMinutes } from '@/types/voice'
import { ActionToast } from './ActionToast'

interface ReminderToastProps {
  text: string
  onSnooze: (minutes: SnoozeMinutes) => void
  onDone: () => void
  onClose: () => void
}

/** A task reminder with Snooze 5 min, Snooze 15 min and Mark done (PRD AC22.1, AC22.4). */
export function ReminderToast({ text, onSnooze, onDone, onClose }: ReminderToastProps) {
  return (
    <ActionToast icon={BellIcon} text={text} onClose={onClose}>
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
    </ActionToast>
  )
}
