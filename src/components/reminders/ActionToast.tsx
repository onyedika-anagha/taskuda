import type { LucideIcon } from 'lucide-react'
import { XIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'

interface ActionToastProps {
  icon: LucideIcon
  text: string
  onClose: () => void
  /** The action buttons; they wrap to a second line on narrow screens. */
  children: ReactNode
}

/**
 * A toast that stays until the user acts (reminders, eye breaks). Sonner toasts hold only one
 * action, so these are custom toasts. They never take focus by themselves (design DAC18).
 */
export function ActionToast({ icon: Icon, text, onClose, children }: ActionToastProps) {
  return (
    <div className="grid w-full gap-3 rounded-(--radius) border bg-popover p-4 text-sm text-popover-foreground shadow-lg sm:w-(--width)">
      <div className="flex items-start gap-2">
        <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <p className="flex-1 font-medium">{text}</p>
        <Button variant="ghost" size="icon" className="-m-2 size-11" aria-label="Close" onClick={onClose}>
          <XIcon aria-hidden="true" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}
