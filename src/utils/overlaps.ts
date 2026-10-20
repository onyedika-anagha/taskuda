import type { Task } from '@/types/task'
import { effectiveMinutes } from './taskDuration'
import { isValidTime, timeToMinutes } from './timeBlocks'

export type OverlapCandidate = Pick<Task, 'id' | 'startTime' | 'durationMinutes' | 'status'>

interface Range {
  start: number
  end: number
}

function rangeOf(task: OverlapCandidate): Range | null {
  if (task.status === 'done' || !task.startTime || !isValidTime(task.startTime)) return null
  const start = timeToMinutes(task.startTime)
  return { start, end: start + effectiveMinutes(task) }
}

/** Ranges that only touch (2:00–2:30 and 2:30–3:00) don't overlap. */
function crosses(a: Range, b: Range): boolean {
  return a.start < b.end && b.start < a.end
}

/**
 * The tasks `task` overlaps among `others` on the same day (PRD AC25.1). Done tasks and tasks
 * without a start time never overlap; calendar tasks count like any other (AC25.4).
 */
export function overlapsFor<T extends OverlapCandidate>(task: OverlapCandidate, others: T[]): T[] {
  const range = rangeOf(task)
  if (!range) return []
  return others.filter((other) => {
    if (other.id === task.id) return false
    const otherRange = rangeOf(other)
    return otherRange !== null && crosses(range, otherRange)
  })
}

/** For one day's tasks: each overlapping task's id → the tasks it overlaps. */
export function overlapMap<T extends OverlapCandidate>(tasks: T[]): Map<string, T[]> {
  const result = new Map<string, T[]>()
  for (const task of tasks) {
    const clashes = overlapsFor(task, tasks)
    if (clashes.length) result.set(task.id, clashes)
  }
  return result
}
