import { addDays, format, isValid, isWeekend, parse } from 'date-fns'

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

/** Monday to Friday. Used for the closeout streak (M2). */
export function isWorkingDay(dayKey: string): boolean {
  return !isWeekend(fromDayKey(dayKey))
}
