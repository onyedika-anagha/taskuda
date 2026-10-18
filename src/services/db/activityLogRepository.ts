import type { ActivityEvent, ActivityEventType } from '@/types/activity'
import { db } from './database'

/** Call inside a transaction that includes `db.activityLog`, so the event and the change save together. */
export async function appendActivity(
  type: ActivityEventType,
  taskId: string,
  dayKey: string,
  data?: Record<string, unknown>,
): Promise<void> {
  await db.activityLog.add({ at: Date.now(), type, taskId, dayKey, ...(data ? { data } : {}) })
}

export function listActivityForDay(dayKey: string): Promise<ActivityEvent[]> {
  return db.activityLog.where('dayKey').equals(dayKey).sortBy('at')
}

export function listActivityForTask(taskId: string): Promise<ActivityEvent[]> {
  return db.activityLog.where('taskId').equals(taskId).sortBy('at')
}

export function listActivityBetween(fromAt: number, toAt: number): Promise<ActivityEvent[]> {
  return db.activityLog.where('at').between(fromAt, toAt, true, true).toArray()
}
