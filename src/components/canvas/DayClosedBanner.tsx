import { format } from 'date-fns'
import { MoonIcon } from 'lucide-react'
import { Link } from 'react-router'

/** S2 success state after closeout: "Day closed at 6:12 PM · View report". */
export function DayClosedBanner({ dayKey, finishedAt }: { dayKey: string; finishedAt: number }) {
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg bg-secondary px-4 py-2 text-sm">
      <MoonIcon aria-hidden="true" className="size-4" />
      <span>Day closed at {format(finishedAt, 'h:mm a')}</span>
      <span aria-hidden="true">·</span>
      <Link
        to={`/report?date=${dayKey}`}
        className="inline-flex min-h-11 items-center font-medium underline underline-offset-4 outline-none hover:no-underline focus-visible:ring-2 focus-visible:ring-ring"
      >
        View report
      </Link>
    </p>
  )
}
