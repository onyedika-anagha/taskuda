import type { Task } from '@/types/task'

/** A timed task without a duration lasts this long, on the canvas and in the calendar (PRD AC25.1). */
export const DEFAULT_TASK_MINUTES = 30

export function effectiveMinutes(task: Pick<Task, 'durationMinutes'>): number {
  return task.durationMinutes ?? DEFAULT_TASK_MINUTES
}
