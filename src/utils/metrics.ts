import { format } from 'date-fns'
import type { Closeout } from '@/types/closeout'
import type { Task } from '@/types/task'
import type { EyeBreakLogEntry, ScreenTimeDay } from '@/types/wellbeing'
import type { Weekday } from '@/types/workday'
import { addDaysToKey, fromDayKey, isWorkingDay } from './dates'
import { dueMoment } from './dueDates'

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
 * M2: consecutive working days with a closeout, counting back from today (PRD AC19.2).
 * Today only counts once closed, so an open day doesn't break the streak; other days are skipped.
 */
export function closeoutStreak(
  closeoutDays: Iterable<string>,
  todayKey: string,
  workingDays: readonly Weekday[],
): number {
  const closed = new Set(closeoutDays)
  const working = (day: string) => isWorkingDay(day, workingDays)
  let day = closed.has(todayKey) || !working(todayKey) ? todayKey : addDaysToKey(todayKey, -1)
  let streak = 0
  // Bounded so corrupted data can't loop forever.
  for (let i = 0; i < 3660; i++, day = addDaysToKey(day, -1)) {
    if (!working(day)) continue
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

/** M4: eye-break prompts marked Done in the window, of those that ended (PRD AC17.2). `null` with none. */
export function eyeBreakFollowThrough(log: EyeBreakLogEntry[], todayKey: string): number | null {
  const start = windowStart(todayKey)
  // A snooze isn't an ending: the prompt comes back and gets its own outcome.
  const ended = log.filter((e) => e.dayKey >= start && e.dayKey <= todayKey && e.outcome !== 'snoozed')
  if (!ended.length) return null
  return ended.filter((e) => e.outcome === 'done').length / ended.length
}

/**
 * M5: past working days in the window with time in Taskuda that stayed within the budget
 * (PRD AC17.2). Today is still running, so it doesn't count yet. `null` with no such days.
 */
export function daysWithinBudget(
  days: ScreenTimeDay[],
  todayKey: string,
  budgetHours: number,
  workingDays: readonly Weekday[],
): number | null {
  const start = windowStart(todayKey)
  const counted = days.filter(
    (d) => d.dayKey >= start && d.dayKey < todayKey && d.ms > 0 && isWorkingDay(d.dayKey, workingDays),
  )
  if (!counted.length) return null
  return counted.filter((d) => d.ms <= budgetHours * 3_600_000).length / counted.length
}

/** AC29.4: average time in Taskuda per day over the 7 full days before today; days not opened count as 0. */
export function sevenDayAverageMs(days: ScreenTimeDay[], todayKey: string): number {
  const start = addDaysToKey(todayKey, -7)
  const total = days.filter((d) => d.dayKey >= start && d.dayKey < todayKey).reduce((sum, d) => sum + d.ms, 0)
  return total / 7
}

/**
 * M6 (PRD AC17.3): tasks whose due moment falls in the window and has passed, done by then. Only the
 * latest copy of a carried task counts, so carrying a task over isn't counted as a miss twice.
 * `doneAt` is each task's latest change to Done (activity log). `null` with no such tasks.
 */
export function deadlinesMet(tasks: Task[], doneAt: ReadonlyMap<string, number>, now: number): number | null {
  const today = format(now, 'yyyy-MM-dd')
  const from = fromDayKey(windowStart(today)).getTime()
  const counted = tasks.filter((t) => {
    const due = dueMoment(t)
    return due !== null && due >= from && due < now && t.carriedToTaskId === null
  })
  if (!counted.length) return null
  const met = counted.filter((t) => t.status === 'done' && (doneAt.get(t.id) ?? t.updatedAt) <= dueMoment(t)!)
  return met.length / counted.length
}
