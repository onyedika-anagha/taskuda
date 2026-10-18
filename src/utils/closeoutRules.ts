import type { TaskOutcome } from '@/types/closeout'
import type { CloseoutStep } from '@/types/closeoutDraft'
import type { Task } from '@/types/task'

/** Tasks that need a decision at closeout: not Done and not already carried to another day. */
export function unfinishedTasks(tasks: Task[]): Task[] {
  return tasks.filter((t) => t.status !== 'done' && !t.carriedToTaskId)
}

export function undecidedCount(tasks: Task[], outcomes: Record<string, TaskOutcome>): number {
  return unfinishedTasks(tasks).filter((t) => !outcomes[t.id]).length
}

/** Sets "carry over" for every unfinished task that has no decision yet. */
export function carryOverAll(
  tasks: Task[],
  outcomes: Record<string, TaskOutcome>,
): Record<string, TaskOutcome> {
  const next = { ...outcomes }
  for (const task of unfinishedTasks(tasks)) next[task.id] ??= 'carry_over'
  return next
}

/** Outcomes for tasks that are still unfinished (a task marked Done mid-closeout drops out). */
export function relevantOutcomes(
  tasks: Task[],
  outcomes: Record<string, TaskOutcome>,
): Record<string, TaskOutcome> {
  const ids = new Set(unfinishedTasks(tasks).map((t) => t.id))
  return Object.fromEntries(Object.entries(outcomes).filter(([id]) => ids.has(id)))
}

export const RATING_LABELS: Record<number, string> = {
  1: 'Rough',
  2: 'Meh',
  3: 'Okay',
  4: 'Good',
  5: 'Great',
}

export const STEP_LABELS: Record<CloseoutStep, string> = {
  unfinished: 'Unfinished',
  reflect: 'Reflect',
  recommendations: 'Recommendations',
  report: 'Report',
}
