import { ResponsiveDialog } from '@/components/common/ResponsiveDialog'
import { CompanyChip } from '@/components/company/CompanyChip'
import { RiskMarker } from '@/components/task/RiskMarker'
import { Button } from '@/components/ui/button'
import type { Company } from '@/types/company'
import type { AtRiskTask } from '@/types/risk'
import type { Task } from '@/types/task'
import { riskLabel } from '@/utils/riskLabels'
import { formatDayShort, formatTime } from '@/utils/taskPresentation'

interface AtRiskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dayKey: string
  today: string
  atRisk: AtRiskTask<Task>[]
  companiesById: Map<string, Company>
  onChoose: (task: Task) => void
}

/**
 * D9 At-risk list (PRD AC32.3, design F19): choosing a task opens it in the editor. Each row's name
 * is its visible text (title, marker, company, time), so it passes label-in-name (WCAG 2.5.3).
 */
export function AtRiskDialog({
  open,
  onOpenChange,
  dayKey,
  today,
  atRisk,
  companiesById,
  onChoose,
}: AtRiskDialogProps) {
  const title = dayKey === today ? 'At risk today' : `At risk on ${formatDayShort(dayKey)}`

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} title={title}>
      {atRisk.length === 0 ? (
        <div className="grid gap-4">
          <p className="text-sm">Nothing at risk right now.</p>
          <Button className="min-h-11 justify-self-end" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      ) : (
        <ul className="grid gap-2">
          {atRisk.map(({ task, kind }) => {
            const company = task.companyId ? companiesById.get(task.companyId) : undefined
            return (
              <li key={task.id}>
                <button
                  type="button"
                  onClick={() => onChoose(task)}
                  className="grid min-h-11 w-full gap-1.5 rounded-lg border bg-card p-3 text-left outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="font-medium">{task.title}</span>
                  <span className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <RiskMarker kind={kind} label={riskLabel(kind, task, today)} className="border" />
                    {company ? <CompanyChip company={company} /> : null}
                    {task.startTime ? (
                      <span className="tabular-nums">{formatTime(task.startTime)}</span>
                    ) : null}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </ResponsiveDialog>
  )
}
