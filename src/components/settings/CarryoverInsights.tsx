import { TriangleAlertIcon } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useCarryoverInsights } from '@/hooks/useCarryoverInsights'
import { useCompanies } from '@/hooks/useCompanies'

const percent = (rate: number) => `${Math.round(rate * 100)}%`

/** S7f Carry-over subsection (PRD FR26): rates, "Needs attention" callouts, and tasks carried 3+ times. */
export function CarryoverInsights() {
  const insights = useCarryoverInsights()
  const { byId } = useCompanies()
  const companyName = (id: string | null) => (id ? (byId.get(id)?.name ?? 'No company') : 'No company')

  return (
    <section aria-labelledby="carryover-heading" className="grid gap-3">
      <h3 id="carryover-heading" className="text-base font-semibold">
        Carry-over, last 4 weeks
      </h3>
      {insights === undefined ? (
        <Skeleton className="h-24 w-full" />
      ) : insights.overall === null ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          Carry-over stats appear once you have past days.
        </p>
      ) : (
        <>
          {insights.needsAttention.length ? (
            <ul className="grid gap-2">
              {insights.needsAttention.map((r) => (
                <li
                  key={r.companyId}
                  className="flex items-start gap-2.5 rounded-lg border bg-card px-4 py-3 text-sm"
                >
                  <TriangleAlertIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  <p>
                    <span className="font-semibold">Needs attention:</span> {companyName(r.companyId)} —{' '}
                    {percent(r.rate)} of tasks carried over in the last 4 weeks.
                  </p>
                </li>
              ))}
            </ul>
          ) : null}

          <ul className="grid divide-y rounded-lg border bg-card text-sm">
            {insights.byCompany.map((r) => (
              <li key={r.companyId ?? 'none'} className="flex justify-between gap-3 px-4 py-2.5">
                <span className="min-w-0 truncate">{companyName(r.companyId)}</span>
                <span className="shrink-0 tabular-nums">{percent(r.rate)} carried over</span>
              </li>
            ))}
            <li className="flex justify-between gap-3 px-4 py-2.5 font-semibold">
              <span>Overall</span>
              <span className="tabular-nums">{percent(insights.overall.rate)}</span>
            </li>
          </ul>

          {insights.repeatedlyCarried.length ? (
            <div className="grid gap-2">
              <h4 className="text-sm font-medium">Carried over 3+ times</h4>
              <ul className="grid gap-1 text-sm">
                {insights.repeatedlyCarried.map((task) => (
                  <li key={task.id}>
                    {task.title}
                    {task.companyId ? ` (${companyName(task.companyId)})` : ''} — carried{' '}
                    {task.carriedOverCount} times
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      )}
    </section>
  )
}
