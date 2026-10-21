import { PartyPopperIcon } from 'lucide-react'
import { CompanyChip } from '@/components/company/CompanyChip'
import { RiskMarker } from '@/components/task/RiskMarker'
import { Button } from '@/components/ui/button'
import type { TaskOutcome } from '@/types/closeout'
import type { Company } from '@/types/company'
import { useTaskRisks } from '@/hooks/useTaskRisks'
import type { Task } from '@/types/task'
import { riskLabel, riskSpokenLabel } from '@/utils/riskLabels'
import { STATUS_LABELS } from '@/utils/taskStatus'
import { OutcomeChooser } from './OutcomeChooser'

interface UnfinishedStepProps {
  tasks: Task[]
  companiesById: Map<string, Company>
  outcomes: Record<string, TaskOutcome>
  undecided: number
  /** Set after the user pressed Next with tasks still undecided. */
  showError: boolean
  onOutcome: (taskId: string, outcome: TaskOutcome) => void
  onCarryAll: () => void
}

export function UnfinishedStep({
  tasks,
  companiesById,
  outcomes,
  undecided,
  showError,
  onOutcome,
  onCarryAll,
}: UnfinishedStepProps) {
  const risks = useTaskRisks(tasks)
  if (tasks.length === 0) {
    return (
      <p className="flex items-center gap-2 py-6 text-base font-medium">
        <PartyPopperIcon aria-hidden="true" className="size-5" />
        Everything’s done. Nice.
      </p>
    )
  }

  const counter = `${undecided} ${undecided === 1 ? 'task still needs' : 'tasks still need'} a decision`

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold">What happens to these tasks?</h3>
        <Button variant="outline" className="min-h-11" onClick={onCarryAll} disabled={undecided === 0}>
          Carry over all
        </Button>
      </div>
      <ul className="grid gap-2">
        {tasks.map((task) => {
          const company = task.companyId ? companiesById.get(task.companyId) : undefined
          const risk = risks.byId.get(task.id)
          return (
            <li key={task.id}>
              <fieldset className="flex flex-col gap-2 rounded-lg border bg-card p-3 sm:flex-row sm:items-center">
                <legend className="sr-only">
                  {risk ? `${task.title}, ${riskSpokenLabel(risk, task, risks.today)}` : task.title}
                </legend>
                <div className="min-w-0 flex-1" aria-hidden="true">
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="min-w-0 truncate font-medium">{task.title}</span>
                    {/* PRD AC31.5 */}
                    {risk ? <RiskMarker kind={risk} label={riskLabel(risk, task, risks.today)} /> : null}
                  </p>
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    {company ? <CompanyChip company={company} /> : null}
                    {STATUS_LABELS[task.status]}
                  </p>
                </div>
                <OutcomeChooser
                  taskId={task.id}
                  value={outcomes[task.id]}
                  onChange={(outcome) => onOutcome(task.id, outcome)}
                />
              </fieldset>
            </li>
          )
        })}
      </ul>
      {undecided > 0 ? (
        <p
          aria-live="polite"
          className={showError ? 'text-sm font-medium text-destructive' : 'text-sm text-muted-foreground'}
        >
          {counter}
        </p>
      ) : null}
    </div>
  )
}
