import { endOfDay, format } from 'date-fns'
import type { Task } from '@/types/task'
import { addDaysToKey, fromDayKey } from './dates'
import { formatTime } from './taskPresentation'
import { timeToMinutes } from './timeBlocks'

type Due = Pick<Task, 'dueDate' | 'dueTime'>

/** A local day and `HH:mm` time as a timestamp, correct across daylight-saving changes. */
export function localMoment(dayKey: string, time: string): number {
  const date = fromDayKey(dayKey)
  const minutes = timeToMinutes(time)
  date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0)
  return date.getTime()
}

/** When the task is due; with no time, the end of that day (PRD AC30.1). `null` without a due date. */
export function dueMoment({ dueDate, dueTime }: Due): number | null {
  if (!dueDate) return null
  return dueTime ? localMoment(dueDate, dueTime) : endOfDay(fromDayKey(dueDate)).getTime()
}

export function isDuePassed(task: Due, now: number): boolean {
  const due = dueMoment(task)
  return due !== null && now > due
}

function dayWords(dueDate: string, todayKey: string): string {
  if (dueDate === todayKey) return 'today'
  if (dueDate === addDaysToKey(todayKey, 1)) return 'tomorrow'
  return format(fromDayKey(dueDate), 'EEE, MMM d')
}

/** Note text (design Section 8): "Due today", "Due tomorrow 9:00 AM", "Due Fri, Oct 24, 5:00 PM". */
export function dueLabel({ dueDate, dueTime }: Due, todayKey: string): string | null {
  if (!dueDate) return null
  const day = dayWords(dueDate, todayKey)
  if (!dueTime) return `Due ${day}`
  const relative = day === 'today' || day === 'tomorrow'
  return `Due ${day}${relative ? ' ' : ', '}${formatTime(dueTime)}`
}

/** For the note's `aria-label`: "due today at 5:00 PM", "due Friday, October 24". */
export function dueSpokenLabel({ dueDate, dueTime }: Due, todayKey: string): string | null {
  if (!dueDate) return null
  const short = dayWords(dueDate, todayKey)
  const day = short === 'today' || short === 'tomorrow' ? short : format(fromDayKey(dueDate), 'EEEE, MMMM d')
  return dueTime ? `due ${day} at ${formatTime(dueTime)}` : `due ${day}`
}
