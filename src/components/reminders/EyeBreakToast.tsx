import { EyeIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ActionToast } from './ActionToast'

interface EyeBreakToastProps {
  text: string
  onDone: () => void
  onSnooze: () => void
  onClose: () => void
}

/** Eye-break prompt with Done and Snooze 5 min (PRD AC28.2, design F15). */
export function EyeBreakToast({ text, onDone, onSnooze, onClose }: EyeBreakToastProps) {
  return (
    <ActionToast icon={EyeIcon} text={text} onClose={onClose}>
      <Button size="sm" className="min-h-11" onClick={onDone}>
        Done
      </Button>
      <Button variant="outline" size="sm" className="min-h-11" onClick={onSnooze}>
        Snooze 5 min
      </Button>
    </ActionToast>
  )
}
