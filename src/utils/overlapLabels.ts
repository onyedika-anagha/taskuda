import type { Task } from '@/types/task'
import { effectiveMinutes } from './taskDuration'
import { timeToMinutes } from './timeBlocks'

type Titled = Pick<Task, 'title'>
type Timed = Pick<Task, 'title' | 'startTime' | 'durationMinutes'>

function clock(minutes: number): { time: string; meridiem: string } {
  const inDay = ((minutes % 1440) + 1440) % 1440
  const hours = Math.floor(inDay / 60)
  const mins = String(inDay % 60).padStart(2, '0')
  return { time: `${hours % 12 || 12}:${mins}`, meridiem: hours < 12 ? 'AM' : 'PM' }
}

/** `14:00` for 30 minutes → `2:00–2:30 PM`; `11:45` for 30 → `11:45 AM–12:15 PM`. */
export function formatTimeRange(startTime: string, minutes: number): string {
  const startMinutes = timeToMinutes(startTime)
  const start = clock(startMinutes)
  const end = clock(startMinutes + minutes)
  return start.meridiem === end.meridiem
    ? `${start.time}–${end.time} ${end.meridiem}`
    : `${start.time} ${start.meridiem}–${end.time} ${end.meridiem}`
}

/** Note marker (design spec Section 10): "Overlaps with Client call" or "Overlaps with 2 tasks". */
export function overlapMarkerLabel(others: Titled[]): string {
  return others.length === 1 ? `Overlaps with ${others[0].title}` : `Overlaps with ${others.length} tasks`
}

/** For the note's `aria-label` (design spec Section 7): "overlaps with Standup". */
export function overlapSpokenLabel(others: Titled[]): string {
  return others.length === 1 ? `overlaps with ${others[0].title}` : `overlaps with ${others.length} tasks`
}

function describe(task: Timed): string {
  return task.startTime
    ? `${task.title} (${formatTimeRange(task.startTime, effectiveMinutes(task))})`
    : task.title
}

/** Editor warning (design spec Section 8): "Overlaps with Client call (2:00–2:30 PM). You can still save." */
export function overlapWarningText(others: Timed[]): string {
  const list =
    others.length === 1 ? describe(others[0]) : `${others.length} tasks: ${others.map(describe).join(', ')}`
  return `Overlaps with ${list}. You can still save.`
}
