import { cn } from '@/lib/utils'
import { formatDuration, spokenDuration } from '@/utils/taskPresentation'

interface BlockTimeLeftProps {
  minutesLeft: number
  className?: string
}

/**
 * "1 h 20 min left" for the current block (PRD FR27). Not a live region: screen readers hear it
 * as part of the block heading ("Afternoon, 1 hour 20 minutes left"), not every minute.
 */
export function BlockTimeLeft({ minutesLeft, className }: BlockTimeLeftProps) {
  return (
    <span className={cn('text-sm font-normal text-muted-foreground tabular-nums', className)}>
      <span aria-hidden="true">{formatDuration(minutesLeft)} left</span>
      <span className="sr-only">, {spokenDuration(minutesLeft)} left</span>
    </span>
  )
}
