import { addDays, format, getDay, isValid, parse } from 'date-fns'
import type { Weekday } from '@/types/workday'

const DAY_KEY_FORMAT = 'yyyy-MM-dd'
const DAY_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function toDayKey(date: Date): string {
  return format(date, DAY_KEY_FORMAT)
}

export function fromDayKey(dayKey: string): Date {
  const date = parse(dayKey, DAY_KEY_FORMAT, new Date())
  if (!DAY_KEY_PATTERN.test(dayKey) || !isValid(date)) throw new Error(`Invalid day key "${dayKey}"`)
  return date
}

export function isValidDayKey(dayKey: string): boolean {
  return DAY_KEY_PATTERN.test(dayKey) && isValid(parse(dayKey, DAY_KEY_FORMAT, new Date()))
}

export function todayKey(now: Date = new Date()): string {
  return toDayKey(now)
}

export function addDaysToKey(dayKey: string, amount: number): string {
  return toDayKey(addDays(fromDayKey(dayKey), amount))
}

/** Day keys sort correctly as strings. */
export function isPastDay(dayKey: string, now: Date = new Date()): boolean {
  return dayKey < todayKey(now)
}

/** PRD FR19: the user's working days drive the streak (M2), carryover and nudges. */
export function isWorkingDay(dayKey: string, workingDays: readonly Weekday[]): boolean {
  return workingDays.includes(getDay(fromDayKey(dayKey)) as Weekday)
}

/** The first working day after `dayKey` (PRD AC11.1). With no working days, the next day. */
export function nextWorkingDay(dayKey: string, workingDays: readonly Weekday[]): string {
  for (let i = 1; i <= 7; i++) {
    const day = addDaysToKey(dayKey, i)
    if (isWorkingDay(day, workingDays)) return day
  }
  return addDaysToKey(dayKey, 1)
}

/** "tomorrow" when `toKey` is the day after `fromKey`, otherwise the weekday name ("Monday"). */
export function relativeDayName(fromKey: string, toKey: string): string {
  return toKey === addDaysToKey(fromKey, 1) ? 'tomorrow' : format(fromDayKey(toKey), 'EEEE')
}
