import { Link } from 'react-router'
import { Skeleton } from '@/components/ui/skeleton'
import { useMetrics } from '@/hooks/useMetrics'
import { CarryoverInsights } from './CarryoverInsights'
import { MetricTile } from './MetricTile'
import { TimeInTaskuda } from './TimeInTaskuda'

function formatMinutes(minutes: number): string {
  return minutes < 10 ? `${minutes.toFixed(1)} min` : `${Math.round(minutes)} min`
}

const formatRate = (rate: number | null) => (rate === null ? '—' : `${Math.round(rate * 100)}%`)

function WorkdayLink({ children }: { children: string }) {
  return (
    <Link to="/settings/workday" className="font-medium underline underline-offset-4">
      {children}
    </Link>
  )
}

/** S7f Stats: M1–M6 (PRD FR17), time in Taskuda (FR29) and carry-over insights (FR26), from this device's data. */
export function StatsSection() {
  const metrics = useMetrics()

  return (
    <section aria-labelledby="stats-heading" className="grid gap-4">
      <h2 id="stats-heading" className="text-lg font-semibold">
        Stats
      </h2>
      {metrics === undefined ? (
        <Skeleton className="h-32 w-full" />
      ) : (
        <>
          {!metrics.hasCloseouts ? (
            <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Your stats appear after your first closeout.
            </p>
          ) : (
            <dl className="grid gap-3 sm:grid-cols-3">
              <MetricTile
                label="Tasks dropped without a decision"
                value={String(metrics.droppedCount)}
                explanation="Unfinished tasks from the last 4 weeks that were never carried over or deleted. Goal: 0."
              />
              <MetricTile
                label="Closeout streak (working days)"
                value={String(metrics.streak)}
                explanation="Weekdays in a row you closed out. Goal: 20 (4 weeks)."
              />
              <MetricTile
                label="Median time to report"
                value={metrics.medianMinutes === null ? '—' : formatMinutes(metrics.medianMinutes)}
                explanation="From starting a closeout to copying the report, last 4 weeks. Goal: 5 min or less."
              />
              {metrics.eyeBreaksOn ? (
                <MetricTile
                  label="Eye breaks taken"
                  value={formatRate(metrics.eyeBreakRate)}
                  explanation="Eye-break prompts you marked Done, last 4 weeks. Goal: 70% or more."
                />
              ) : (
                <MetricTile
                  label="Eye breaks taken"
                  value="Off"
                  explanation="Eye breaks are off."
                  action={<WorkdayLink>Turn on in Workday</WorkdayLink>}
                />
              )}
              {metrics.budgetHours !== null ? (
                <MetricTile
                  label="Days within time budget"
                  value={formatRate(metrics.budgetRate)}
                  explanation={`Working days with ${metrics.budgetHours} h or less in Taskuda on this device, last 4 weeks. Goal: 80% or more.`}
                />
              ) : (
                <MetricTile
                  label="Days within time budget"
                  value="Off"
                  explanation="No time budget set."
                  action={<WorkdayLink>Set one in Workday</WorkdayLink>}
                />
              )}
              <MetricTile
                label="Deadlines met"
                value={metrics.deadlineRate === null ? '—' : formatRate(metrics.deadlineRate)}
                explanation={
                  metrics.deadlineRate === null
                    ? 'No due dates yet.'
                    : 'Tasks with a due date that were done on time, last 4 weeks. Goal: 85% or more.'
                }
              />
            </dl>
          )}
          <TimeInTaskuda todayMs={metrics.todayMs} averageMs={metrics.averageMs} />
        </>
      )}
      <CarryoverInsights />
    </section>
  )
}
