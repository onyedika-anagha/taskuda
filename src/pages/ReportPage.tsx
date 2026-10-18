import { ArrowLeftIcon } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { AppBar } from '@/components/layout/AppBar'
import { AppShell } from '@/components/layout/AppShell'
import { ReportBuilder } from '@/components/report/ReportBuilder'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useCompanies } from '@/hooks/useCompanies'
import { useTasksForDay } from '@/hooks/useTasksForDay'
import { recordReportCopied } from '@/services/db/closeoutRepository'
import { isValidDayKey, todayKey } from '@/utils/dates'
import { formatDayLong } from '@/utils/taskPresentation'

/** S6 Report for one day (`/report?date=yyyy-MM-dd`, default today), without a closeout. */
export function ReportPage() {
  const [params] = useSearchParams()
  const requested = params.get('date')
  const dayKey = requested && isValidDayKey(requested) ? requested : todayKey()
  const tasks = useTasksForDay(dayKey)
  const { companies } = useCompanies()
  const backTo = dayKey === todayKey() ? '/' : `/day/${dayKey}`

  return (
    <AppShell
      appBar={
        <AppBar>
          <div className="flex min-w-0 items-center gap-1">
            <Button asChild variant="ghost" size="icon" className="size-11">
              <Link to={backTo} aria-label="Back to the day">
                <ArrowLeftIcon aria-hidden="true" />
              </Link>
            </Button>
            <h1 className="truncate text-lg font-semibold">Report · {formatDayLong(dayKey)}</h1>
          </div>
        </AppBar>
      }
    >
      <div className="mx-auto w-full max-w-3xl">
        {tasks === undefined || companies === undefined ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <ReportBuilder
            dayKey={dayKey}
            tasks={tasks}
            companies={companies}
            // Counts toward M3 only if this day's closeout hasn't recorded a copy yet.
            onCopied={(at) => void recordReportCopied(dayKey, at)}
          />
        )}
      </div>
    </AppShell>
  )
}
