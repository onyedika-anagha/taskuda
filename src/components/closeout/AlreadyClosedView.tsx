import { format } from 'date-fns'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { todayKey } from '@/utils/dates'
import { formatDayShort } from '@/utils/taskPresentation'

interface AlreadyClosedViewProps {
  dayKey: string
  finishedAt: number
  onCloseAgain: () => void
  onViewReport: () => void
}

export function AlreadyClosedView({
  dayKey,
  finishedAt,
  onCloseAgain,
  onViewReport,
}: AlreadyClosedViewProps) {
  const day = dayKey === todayKey() ? 'today' : formatDayShort(dayKey)
  return (
    <div className="grid gap-4">
      <p>
        You closed out {day} at {format(finishedAt, 'h:mm a')}.
      </p>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" size="lg" onClick={onCloseAgain}>
          Close out again
        </Button>
        <Button asChild size="lg">
          <Link to={`/report?date=${dayKey}`} onClick={onViewReport}>
            View report
          </Link>
        </Button>
      </div>
    </div>
  )
}
