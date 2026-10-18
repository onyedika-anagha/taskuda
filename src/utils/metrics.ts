import type { Closeout } from '@/types/closeout'
import type { Task } from '@/types/task'
import { addDaysToKey, isWorkingDay } from './dates'

/** The PRD's 4-week measurement window. */
export const METRIC_WINDOW_DAYS = 28

export function windowStart(todayKey: string, days = METRIC_WINDOW_DAYS): string {
  return addDaysToKey(todayKey, -days)
}

/**
 * M1: tasks from past days in the window that were neither done, carried over nor deliberately
 * deleted (deleted tasks no longer exist, so they never count).
 */
export function silentlyDroppedCount(tasks: Task[], todayKey: string): number {
  const start = windowStart(todayKey)
  return tasks.filter(
    (t) => t.dayKey >= start && t.dayKey < todayKey && t.status !== 'done' && !t.carriedToTaskId,
  ).length
}

/**
 * M2: consecutive working days (Mon–Fri) with a closeout, counting back from today.
 * Today only counts once closed, so an open day doesn't break the streak; weekends are skipped.
 */
export function closeoutStreak(closeoutDays: Iterable<string>, todayKey: string): number {
  const closed = new Set(closeoutDays)
  let day = closed.has(todayKey) || !isWorkingDay(todayKey) ? todayKey : addDaysToKey(todayKey, -1)
  let streak = 0
  // Bounded so corrupted data can't loop forever.
  for (let i = 0; i < 3660; i++, day = addDaysToKey(day, -1)) {
    if (!isWorkingDay(day)) continue
    if (!closed.has(day)) break
    streak++
  }
  return streak
}

/** M3: median minutes from "Start closeout" to "Report copied" in the window; `null` with no data. */
export function medianMinutesToReport(closeouts: Closeout[], todayKey: string): number | null {
  const start = windowStart(todayKey)
  const minutes = closeouts
    .filter((c) => c.dayKey >= start && c.reportCopiedAt !== null)
    .map((c) => ((c.reportCopiedAt as number) - c.startedAt) / 60_000)
    .filter((m) => m >= 0)
    .sort((a, b) => a - b)
  if (!minutes.length) return null
  const mid = Math.floor(minutes.length / 2)
  return minutes.length % 2 ? minutes[mid] : (minutes[mid - 1] + minutes[mid]) / 2
}
