import { format } from 'date-fns'
import type { RiskKind, RiskStrength } from '@/types/risk'
import type { Task } from '@/types/task'
import { fromDayKey } from './dates'
import { dueSpokenLabel } from './dueDates'
import { effectiveMinutes } from './taskDuration'
import { formatTime } from './taskPresentation'
import { timeToMinutes } from './timeBlocks'

type Labelled = Pick<Task, 'startTime' | 'durationMinutes' | 'dueDate' | 'dueTime' | 'carriedOverCount'>

export const RISK_STRENGTH: Record<RiskKind, RiskStrength> = {
  overdue: 'strong',
  overran: 'strong',
  running_late: 'standard',
  due_today: 'standard',
  stuck: 'standard',
}

function endTime(task: Labelled): string {
  const end = (timeToMinutes(task.startTime!) + effectiveMinutes(task)) % 1440
  return `${String(Math.floor(end / 60)).padStart(2, '0')}:${String(end % 60).padStart(2, '0')}`
}

/** "Oct 20", or "5:00 PM" when it was due earlier today. */
function overdueWhen(task: Labelled, today: string, long: boolean): string {
  if (task.dueDate === today && task.dueTime) return formatTime(task.dueTime)
  return format(fromDayKey(task.dueDate!), long ? 'MMMM d' : 'MMM d')
}

/** Marker text (design Section 8): "Overdue · due Oct 20", "Running late · 10:00 AM". */
export function riskLabel(kind: RiskKind, task: Labelled, today: string): string {
  switch (kind) {
    case 'overdue':
      return `Overdue · due ${overdueWhen(task, today, false)}`
    case 'overran':
      return `Overran · ended ${formatTime(endTime(task))}`
    case 'running_late':
      return `Running late · ${formatTime(task.startTime!)}`
    case 'due_today':
      return task.dueTime ? `Due today ${formatTime(task.dueTime)}` : 'Due today'
    case 'stuck':
      return `Stuck · carried over ×${task.carriedOverCount}`
  }
}

/** For the note's `aria-label` (design Section 8): "running late, was due to start at 10:00 AM". */
export function riskSpokenLabel(kind: RiskKind, task: Labelled, today: string): string {
  switch (kind) {
    case 'overdue':
      return `overdue, due ${overdueWhen(task, today, true)}`
    case 'overran':
      return `overran, ended ${formatTime(endTime(task))}`
    case 'running_late':
      return `running late, was due to start at ${formatTime(task.startTime!)}`
    case 'due_today':
      return dueSpokenLabel(task, today)!
    case 'stuck':
      return `stuck, carried over ${task.carriedOverCount} times`
  }
}
