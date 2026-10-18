import type { TimeBlock } from '@/types/task'

/** Block boundaries in minutes after midnight. Evening wraps past midnight to 04:59. */
const MORNING_START = 5 * 60
const AFTERNOON_START = 12 * 60
const EVENING_START = 17 * 60

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/

export function isValidTime(time: string): boolean {
  return TIME_PATTERN.test(time)
}

export function timeToMinutes(time: string): number {
  const match = TIME_PATTERN.exec(time)
  if (!match) throw new Error(`Invalid time "${time}", expected HH:mm`)
  return Number(match[1]) * 60 + Number(match[2])
}

export function blockForMinutes(minutes: number): TimeBlock {
  if (minutes >= MORNING_START && minutes < AFTERNOON_START) return 'morning'
  if (minutes >= AFTERNOON_START && minutes < EVENING_START) return 'afternoon'
  return 'evening'
}

export function blockForTime(time: string): TimeBlock {
  return blockForMinutes(timeToMinutes(time))
}

export function blockForDate(date: Date): TimeBlock {
  return blockForMinutes(date.getHours() * 60 + date.getMinutes())
}

export function isTimeInBlock(time: string, block: TimeBlock): boolean {
  return blockForTime(time) === block
}
