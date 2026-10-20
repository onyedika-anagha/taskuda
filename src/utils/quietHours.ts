import type { QuietHours, TimeRange } from '@/types/workday'
import { timeToMinutes } from './timeBlocks'

/** Is `date`'s time of day inside the range? Start is included, end isn't; `22:00–07:00` runs overnight. */
export function isInTimeRange(date: Date, range: TimeRange): boolean {
  const now = date.getHours() * 60 + date.getMinutes()
  const start = timeToMinutes(range.start)
  const end = timeToMinutes(range.end)
  if (start === end) return false
  return start < end ? now >= start && now < end : now >= start || now < end
}

/** PRD AC23.2: nothing is spoken (and no eye-break prompts) inside quiet hours. */
export function isInQuietHours(date: Date, quietHours: QuietHours): boolean {
  return quietHours.enabled && isInTimeRange(date, quietHours)
}

/** A range whose start is later than its end continues into the next morning. */
export function isOvernight(range: TimeRange): boolean {
  return timeToMinutes(range.start) > timeToMinutes(range.end)
}
