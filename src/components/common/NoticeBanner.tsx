import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface NoticeAction {
  label: string
  onClick: () => void
  variant?: 'default' | 'outline' | 'ghost'
}

interface NoticeBannerProps {
  icon: LucideIcon
  message: string
  actions: NoticeAction[]
}

/**
 * The S2 banners for the closeout nudge and the time budget (design spec Section 5): one message
 * and one or two actions, which wrap below the text on narrow screens. Styled like Alert, but
 * without its `role="alert"`, which interrupts: callers announce the message politely instead.
 */
export function NoticeBanner({ icon: Icon, message, actions }: NoticeBannerProps) {
  return (
    <div
      data-slot="notice"
      className="flex flex-col gap-3 rounded-lg border bg-card px-4 py-3 text-sm min-[480px]:flex-row min-[480px]:items-center"
    >
      <div className="flex flex-1 items-start gap-2.5">
        <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <p>{message}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <Button
            key={action.label}
            size="sm"
            variant={action.variant ?? 'default'}
            className="min-h-11"
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
