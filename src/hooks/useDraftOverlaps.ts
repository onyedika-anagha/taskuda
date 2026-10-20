import { useMemo } from 'react'
import { useWatch, type Control } from 'react-hook-form'
import type { TaskFormValues } from '@/schemas/taskForm'
import type { Task } from '@/types/task'
import { overlapsFor } from '@/utils/overlaps'
import { isValidTime } from '@/utils/timeBlocks'

/**
 * The day's tasks that the editor's current start time and duration overlap (PRD AC25.3).
 * An editing task is checked as it is being changed, never against itself.
 */
export function useDraftOverlaps(control: Control<TaskFormValues>, dayTasks: Task[], editing?: Task): Task[] {
  const [startTime, duration] = useWatch({ control, name: ['startTime', 'durationMinutes'] })
  return useMemo(() => {
    if (!isValidTime(startTime)) return []
    const minutes = /^\d+$/.test(duration) && Number(duration) > 0 ? Number(duration) : null
    const draft = {
      id: editing?.id ?? '',
      startTime,
      durationMinutes: minutes,
      status: editing?.status ?? ('todo' as const),
    }
    return overlapsFor(draft, dayTasks)
  }, [startTime, duration, dayTasks, editing?.id, editing?.status])
}
