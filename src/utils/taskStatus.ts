import type { TaskStatus } from '@/types/task'

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
}

const NEXT_STATUS: Record<TaskStatus, TaskStatus> = {
  todo: 'in_progress',
  in_progress: 'done',
  done: 'todo',
}

/** To Do → In Progress → Done → To Do (PRD AC4.1). */
export function nextStatus(status: TaskStatus): TaskStatus {
  return NEXT_STATUS[status]
}
