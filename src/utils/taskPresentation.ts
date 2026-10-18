import { format, parse } from 'date-fns'
import type { Company } from '@/types/company'
import type { Task, TimeBlock } from '@/types/task'
import { fromDayKey } from './dates'
import { STATUS_LABELS } from './taskStatus'

export const BLOCK_LABELS: Record<TimeBlock, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
}

/** Empty-block copy (design spec Section 8). */
export const EMPTY_BLOCK_MESSAGES: Record<TimeBlock, string> = {
  morning: 'Nothing planned for the morning.',
  afternoon: 'Nothing planned for the afternoon.',
  evening: 'Nothing planned for the evening.',
}

/** `14:00` → `2:00 PM`. */
export function formatTime(time: string): string {
  return format(parse(time, 'HH:mm', new Date(2000, 0, 1)), 'h:mm a')
}

/** `2026-10-14` → `Tue, Oct 14`. */
export function formatDayShort(dayKey: string): string {
  return format(fromDayKey(dayKey), 'EEE, MMM d')
}

/** `2026-10-19` → `Monday, Oct 19`. */
export function formatDayLong(dayKey: string): string {
  return format(fromDayKey(dayKey), 'EEEE, MMM d')
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (!hours) return `${rest} min`
  return rest ? `${hours} h ${rest} min` : `${hours} h`
}

export function carriedOverLabel(count: number): string {
  return count > 1 ? `Carried over ×${count}` : 'Carried over'
}

/** Screen-reader label for a note: "Client call, Acme, 2:00 PM, In Progress" (design spec Section 7). */
export function taskAriaLabel(task: Task, company: Company | undefined): string {
  const parts = [task.title]
  if (company) parts.push(company.name)
  if (task.startTime) parts.push(formatTime(task.startTime))
  parts.push(STATUS_LABELS[task.status])
  if (task.carriedOverCount > 0) {
    parts.push(task.carriedOverCount > 1 ? `carried over ${task.carriedOverCount} times` : 'carried over')
  }
  if (task.source === 'calendar') parts.push('from Google Calendar')
  return parts.join(', ')
}
