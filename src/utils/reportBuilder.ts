import type { TaskOutcome } from '@/types/closeout'
import type { Company } from '@/types/company'
import type { ReportData, ReportGroup, ReportItem, ReportScope } from '@/types/report'
import type { Task } from '@/types/task'

interface BuildReportInput {
  dayKey: string
  tasks: Task[]
  companies: Company[]
  scope: ReportScope
  /** Closeout choices not yet applied; "carry over" already shows in the report before Finish. */
  pendingOutcomes?: Record<string, TaskOutcome>
}

const toItem = (task: Task): ReportItem => ({ title: task.title, jiraKey: task.jiraIssue?.key ?? null })

function groupFor(tasks: Task[], heading: string | null, pending: Record<string, TaskOutcome>): ReportGroup {
  const isCarried = (t: Task) =>
    t.status !== 'done' && (!!t.carriedToTaskId || pending[t.id] === 'carry_over')
  return {
    heading,
    done: tasks.filter((t) => t.status === 'done').map(toItem),
    inProgress: tasks.filter((t) => t.status === 'in_progress' && !isCarried(t)).map(toItem),
    carried: tasks.filter(isCarried).map(toItem),
  }
}

export function isGroupEmpty(group: ReportGroup): boolean {
  return group.done.length + group.inProgress.length + group.carried.length === 0
}

export function isReportEmpty(report: ReportData): boolean {
  return report.groups.every(isGroupEmpty)
}

/**
 * Done / In progress / Carried to tomorrow for one day (PRD AC14.4).
 * "All companies" groups by company; tasks with no company come last under "Other".
 * Tasks being deleted at closeout are left out.
 */
export function buildReport({
  dayKey,
  tasks,
  companies,
  scope,
  pendingOutcomes = {},
}: BuildReportInput): ReportData {
  const kept = tasks.filter((t) => pendingOutcomes[t.id] !== 'delete')

  if (scope !== 'all') {
    const company = companies.find((c) => c.id === scope)
    const own = kept.filter((t) => t.companyId === scope)
    return { dayKey, scopeName: company?.name ?? null, groups: [groupFor(own, null, pendingOutcomes)] }
  }

  const known = new Set(companies.map((c) => c.id))
  const groups = [...companies]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((company) =>
      groupFor(
        kept.filter((t) => t.companyId === company.id),
        company.name,
        pendingOutcomes,
      ),
    )
  const other = kept.filter((t) => !t.companyId || !known.has(t.companyId))
  const hasCompanies = groups.some((g) => !isGroupEmpty(g))
  groups.push(groupFor(other, hasCompanies ? 'Other' : null, pendingOutcomes))
  return { dayKey, scopeName: null, groups: groups.filter((g) => !isGroupEmpty(g)) }
}
