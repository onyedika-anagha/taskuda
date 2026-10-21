import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect } from 'react'
import { ensureOccurrences } from '@/services/db/seriesRepository'
import { listTasksForDay } from '@/services/db/taskRepository'
import type { Task } from '@/types/task'

/**
 * Tasks for one day, sorted by block then position. Re-renders whenever the
 * stored tasks change, including changes made by background sync.
 * `undefined` while the first read is in progress (loading state).
 */
export function useTasksForDay(dayKey: string): Task[] | undefined {
  // Showing today or a future day adds its repeating tasks (PRD AC20.2); past days never change.
  useEffect(() => {
    void ensureOccurrences(dayKey).catch(() => {})
  }, [dayKey])
  return useLiveQuery(() => listTasksForDay(dayKey), [dayKey])
}
