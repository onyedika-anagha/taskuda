import type { Weekday } from '@/types/workday'
import { isWorkingDay, toDayKey } from '@/utils/dates'
import { formatTime } from '@/utils/taskPresentation'
import { timeToMinutes } from '@/utils/timeBlocks'

/**
 * The toast and voice line only come if Taskuda is open when the nudge time arrives (PRD AC21.4).
 * Background tabs tick about once a minute, so allow a little slack.
 */
export const NUDGE_ALERT_WINDOW_MS = 2 * 60_000

export interface NudgeState {
  now: Date
  /** `HH:mm`, or `null` when the nudge is off. */
  reminderTime: string | null
  workingDays: readonly Weekday[]
  closedToday: boolean
  /** The day "Not today" was pressed on. */
  dismissedDay: string | null
}

function reminderAt(now: Date, time: string): number {
  const at = new Date(now)
  at.setHours(0, 0, 0, 0)
  return at.getTime() + timeToMinutes(time) * 60_000
}

/** PRD AC21.2–AC21.4: a working day, past the nudge time, not closed out and not dismissed today. */
export function isNudgeDue({ now, reminderTime, workingDays, closedToday, dismissedDay }: NudgeState): boolean {
  if (!reminderTime || closedToday) return false
  const today = toDayKey(now)
  if (!isWorkingDay(today, workingDays) || dismissedDay === today) return false
  return now.getTime() >= reminderAt(now, reminderTime)
}

/** The toast and voice line come once a day, and only when Taskuda is open at the nudge time (AC21.3, AC21.4). */
export function shouldAlertNudge(state: NudgeState, alertedDay: string | null, visible: boolean): boolean {
  if (!isNudgeDue(state) || alertedDay === toDayKey(state.now) || !visible) return false
  return state.now.getTime() - reminderAt(state.now, state.reminderTime as string) <= NUDGE_ALERT_WINDOW_MS
}

/** Design spec Section 8: banner and toast text, and the spoken line. */
export function nudgeText(reminderTime: string): { message: string; voice: string } {
  const time = formatTime(reminderTime)
  return {
    message: `It’s ${time}. Ready to close out your day?`,
    voice: `It’s ${time}. Time to close out your day.`,
  }
}
