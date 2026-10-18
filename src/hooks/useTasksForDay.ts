import { useLiveQuery } from 'dexie-react-hooks'
import { listTasksForDay } from '@/services/db/taskRepository'
import type { Task } from '@/types/task'

/**
 * Tasks for one day, sorted by block then position. Re-renders whenever the
 * stored tasks change, including changes made by background sync.
 * `undefined` while the first read is in progress (loading state).
 */
export function useTasksForDay(dayKey: string): Task[] | undefined {
  return useLiveQuery(() => listTasksForDay(dayKey), [dayKey])
}
