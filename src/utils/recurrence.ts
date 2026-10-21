import { getDate, getDay, getDaysInMonth } from 'date-fns'
import type { RecurringSeries, RepeatPattern } from '@/types/recurring'
import type { Weekday } from '@/types/workday'
import { fromDayKey, isWorkingDay } from './dates'

/** Does the pattern fall on `dayKey`? Monthly on 29–31 uses the last day of shorter months (AC20.1). */
export function matchesDay(pattern: RepeatPattern, dayKey: string, workingDays: readonly Weekday[]): boolean {
  const date = fromDayKey(dayKey)
  switch (pattern.kind) {
    case 'daily':
      return true
    case 'working_days':
      return isWorkingDay(dayKey, workingDays)
    case 'weekly':
      return pattern.weekdays.includes(getDay(date) as Weekday)
    case 'monthly':
      return getDate(date) === Math.min(pattern.dayOfMonth, getDaysInMonth(date))
  }
}

/** Should the series have an occurrence on `dayKey`? */
export function seriesFallsOn(
  series: RecurringSeries,
  dayKey: string,
  workingDays: readonly Weekday[],
): boolean {
  if (dayKey < series.startDayKey) return false
  if (series.endedFromDayKey !== null && dayKey >= series.endedFromDayKey) return false
  if (series.skippedDayKeys.includes(dayKey)) return false
  return matchesDay(series.pattern, dayKey, workingDays)
}

/** Repeats marker (design spec Section 8): never the raw pattern value. */
export const REPEAT_MARKER: Record<RepeatPattern['kind'], string> = {
  daily: 'Repeats daily',
  working_days: 'Repeats on working days',
  weekly: 'Repeats weekly',
  monthly: 'Repeats monthly',
}

/** Same pattern, ignoring weekday order. `null` is "Doesn't repeat". */
export function samePattern(a: RepeatPattern | null, b: RepeatPattern | null): boolean {
  if (a === null || b === null) return a === b
  if (a.kind !== b.kind) return false
  if (a.kind === 'weekly' && b.kind === 'weekly') {
    return [...a.weekdays].sort().join() === [...b.weekdays].sort().join()
  }
  if (a.kind === 'monthly' && b.kind === 'monthly') return a.dayOfMonth === b.dayOfMonth
  return true
}

/** The repeats marker for a task: its series' pattern while the series still runs on its day. */
export function repeatKindFor(
  task: { seriesId: string | null; dayKey: string },
  seriesById: ReadonlyMap<string, RecurringSeries>,
): RepeatPattern['kind'] | null {
  const series = task.seriesId ? seriesById.get(task.seriesId) : undefined
  if (!series) return null
  if (series.endedFromDayKey !== null && task.dayKey >= series.endedFromDayKey) return null
  return series.pattern.kind
}
