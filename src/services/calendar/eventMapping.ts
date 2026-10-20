import { addMinutes, differenceInMinutes, format } from 'date-fns'
import { TASK_TITLE_MAX_LENGTH } from '@/services/db/taskRepository'
import type { EventInput } from '@/services/google/calendarApi'
import type { CalendarEvent } from '@/types/calendar'
import type { Task } from '@/types/task'
import { fromDayKey, toDayKey } from '@/utils/dates'
import { effectiveMinutes } from '@/utils/taskDuration'
import { timeToMinutes } from '@/utils/timeBlocks'

/** Marks events Taskuda created, so they can be matched back to their task. */
export const TASK_ID_PROPERTY = 'taskudaTaskId'

export function localTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

function localDateTime(dayKey: string, startTime: string, plusMinutes = 0): string {
  const start = addMinutes(fromDayKey(dayKey), timeToMinutes(startTime) + plusMinutes)
  return format(start, "yyyy-MM-dd'T'HH:mm:ss")
}

/** Calendar event for a task with a start time (PRD AC8.1). */
export function taskToEvent(task: Task & { startTime: string }, companyName?: string): EventInput {
  const timeZone = localTimeZone()
  const minutes = effectiveMinutes(task)
  return {
    summary: task.title,
    description: companyName ? `${companyName} · from Taskuda` : 'From Taskuda',
    start: { dateTime: localDateTime(task.dayKey, task.startTime), timeZone },
    end: { dateTime: localDateTime(task.dayKey, task.startTime, minutes), timeZone },
    extendedProperties: { private: { [TASK_ID_PROPERTY]: task.id } },
  }
}

export interface EventTaskFields {
  title: string
  dayKey: string
  startTime: string
  durationMinutes: number | null
}

/**
 * The task fields an event maps to, in local time. `null` for events Taskuda doesn't turn into
 * tasks: all-day events (birthdays, holidays) and events without a start time.
 */
export function eventToTaskFields(event: CalendarEvent): EventTaskFields | null {
  const startValue = event.start?.dateTime
  if (!startValue) return null
  const start = new Date(startValue)
  if (Number.isNaN(start.getTime())) return null
  const end = event.end?.dateTime ? new Date(event.end.dateTime) : null
  const minutes = end ? differenceInMinutes(end, start) : 0
  return {
    title: (event.summary?.trim() || 'Untitled event').slice(0, TASK_TITLE_MAX_LENGTH),
    dayKey: toDayKey(start),
    startTime: format(start, 'HH:mm'),
    durationMinutes: minutes > 0 ? Math.min(minutes, 24 * 60) : null,
  }
}

export function eventUpdatedAt(event: CalendarEvent): number {
  const time = Date.parse(event.updated)
  return Number.isNaN(time) ? 0 : time
}
