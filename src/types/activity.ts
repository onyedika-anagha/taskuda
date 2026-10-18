export type ActivityEventType =
  | 'task_created'
  | 'task_updated'
  | 'task_status_changed'
  | 'task_moved'
  | 'task_carried_over'
  | 'task_deleted'

export interface ActivityEvent {
  id?: number
  at: number
  type: ActivityEventType
  taskId: string
  dayKey: string
  data?: Record<string, unknown>
}
