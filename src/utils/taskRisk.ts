import { RISK_KINDS, type AtRiskTask, type RiskKind } from '@/types/risk'
import type { Task } from '@/types/task'
import { REPEATED_CARRY_COUNT } from './carryoverInsights'
import { todayKey } from './dates'
import { dueMoment, localMoment } from './dueDates'
import { effectiveMinutes } from './taskDuration'

/** A To Do task this long past its start is running late (PRD AC31.1). */
export const LATE_GRACE_MINUTES = 10

export type RiskInput = Pick<
  Task,
  'dayKey' | 'status' | 'startTime' | 'durationMinutes' | 'dueDate' | 'dueTime' | 'carriedOverCount'
>

/**
 * The one at-risk state a task shows at `now`, or `null` (PRD AC31.1–AC31.3). Start and end times
 * are on the task's own day, the same as reminders. Done tasks and tasks on past days have none.
 */
export function taskRisk(task: RiskInput, now: number): RiskKind | null {
  const today = todayKey(new Date(now))
  if (task.status === 'done' || task.dayKey < today) return null

  const due = dueMoment(task)
  const start = task.dayKey === today && task.startTime ? localMoment(task.dayKey, task.startTime) : null
  const minute = 60_000

  const applies: Record<RiskKind, boolean> = {
    overdue: due !== null && now > due,
    overran: start !== null && now >= start + effectiveMinutes(task) * minute,
    running_late: start !== null && task.status === 'todo' && now >= start + LATE_GRACE_MINUTES * minute,
    due_today: task.dueDate === today,
    stuck: task.carriedOverCount >= REPEATED_CARRY_COUNT,
  }
  return RISK_KINDS.find((kind) => applies[kind]) ?? null
}

const RANK = new Map(RISK_KINDS.map((kind, index) => [kind, index]))

/** D9 order (PRD AC32.3): by risk priority, then start time (untimed last), then position. */
export function atRiskTasks<T extends RiskInput & Pick<Task, 'order'>>(
  tasks: T[],
  now: number,
): AtRiskTask<T>[] {
  const result: AtRiskTask<T>[] = []
  for (const task of tasks) {
    const kind = taskRisk(task, now)
    if (kind) result.push({ task, kind })
  }
  return result.sort(
    (a, b) =>
      RANK.get(a.kind)! - RANK.get(b.kind)! ||
      (a.task.startTime ?? '99:99').localeCompare(b.task.startTime ?? '99:99') ||
      a.task.order - b.task.order,
  )
}
