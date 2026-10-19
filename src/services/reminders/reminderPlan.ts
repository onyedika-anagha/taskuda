import type { Task } from '@/types/task'
import type { Reminder } from '@/types/voice'
import { fromDayKey } from '@/utils/dates'
import { formatTime } from '@/utils/taskPresentation'
import { timeToMinutes } from '@/utils/timeBlocks'

/** A due reminder this late (e.g. the tab was asleep) counts as missed instead of being spoken. */
export const ON_TIME_TOLERANCE_MS = 60_000

/** Today's reminders for timed tasks that aren't done (PRD AC9.1, AC9.2). */
export function planReminders(tasks: Task[], leadMinutes: number): Reminder[] {
  const reminders: Reminder[] = []
  for (const task of tasks) {
    if (!task.startTime || task.status === 'done') continue
    const start = fromDayKey(task.dayKey).getTime() + timeToMinutes(task.startTime) * 60_000
    const key = `${task.id}:${task.dayKey}:${task.startTime}`
    if (leadMinutes > 0) {
      reminders.push({
        id: `${key}:upcoming:${leadMinutes}`,
        taskId: task.id,
        kind: 'upcoming',
        at: start - leadMinutes * 60_000,
        text: `Up next at ${formatTime(task.startTime)}: ${task.title}.`,
      })
    }
    reminders.push({
      id: `${key}:start`,
      taskId: task.id,
      kind: 'start',
      at: start,
      text: `Starting now: ${task.title}.`,
    })
  }
  return reminders.sort((a, b) => a.at - b.at)
}

export interface DueReminders {
  /** Due now and the user is here: speak and show. */
  onTime: Reminder[]
  /** Came due while the app was hidden or closed: list in the catch-up panel (AC9.5). */
  missed: Reminder[]
}

/**
 * Splits reminders that are due and not yet handled. A reminder only counts if it came due after
 * its task was created, so adding a 9:00 task at noon doesn't "miss" anything.
 */
export function dueReminders(
  reminders: Reminder[],
  tasksById: Map<string, Task>,
  handled: Set<string>,
  now: number,
  visible: boolean,
): DueReminders {
  const result: DueReminders = { onTime: [], missed: [] }
  for (const reminder of reminders) {
    if (reminder.at > now || handled.has(reminder.id)) continue
    const task = tasksById.get(reminder.taskId)
    if (!task || reminder.at < task.createdAt) continue
    if (visible && now - reminder.at <= ON_TIME_TOLERANCE_MS) result.onTime.push(reminder)
    else result.missed.push(reminder)
  }
  // Only the latest alert per task is worth saying ("Starting now" makes "Up next" redundant).
  const latest = new Map<string, Reminder>()
  for (const r of result.onTime) latest.set(r.taskId, r)
  result.onTime = [...latest.values()]
  return result
}

export const CHEERS = ['Nice work.', 'Done. On to the next.', 'That’s one off the list.'] as const

export function pickCheer(random: number = Math.random()): string {
  return CHEERS[Math.min(CHEERS.length - 1, Math.floor(random * CHEERS.length))]
}
