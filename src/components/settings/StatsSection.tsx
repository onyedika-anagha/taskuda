import { Skeleton } from '@/components/ui/skeleton'
import { useMetrics } from '@/hooks/useMetrics'
import { MetricTile } from './MetricTile'

function formatMinutes(minutes: number): string {
  return minutes < 10 ? `${minutes.toFixed(1)} min` : `${Math.round(minutes)} min`
}

/** S7f Stats: M1–M3 from this device's data (PRD FR17). */
export function StatsSection() {
  const metrics = useMetrics()

  return (
    <section aria-labelledby="stats-heading" className="grid gap-4">
      <h2 id="stats-heading" className="text-lg font-semibold">
        Stats
      </h2>
      {metrics === undefined ? (
        <Skeleton className="h-32 w-full" />
      ) : !metrics.hasCloseouts ? (
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
        </dl>
      )}
    </section>
  )
}
