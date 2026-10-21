import { ON_TIME_TOLERANCE_MS } from '@/services/reminders/reminderPlan'
import type { EyeBreakSettings, QuietHours, Weekday } from '@/types/workday'
import { isWorkingDay, toDayKey } from '@/utils/dates'
import { isInQuietHours, isInTimeRange } from '@/utils/quietHours'
import { timeToMinutes } from '@/utils/timeBlocks'

export interface EyeBreakState {
  now: number
  settings: EyeBreakSettings
  workingDays: readonly Weekday[]
  quietHours: QuietHours
  /** When the last prompt was shown or skipped (ms), or `null`. */
  lastPromptAt: number | null
  /** A snoozed prompt comes back at this time (ms). */
  snoozedUntil: number | null
  /** When Taskuda was opened (ms): prompts only count time while it's open (PRD AC28.2). */
  openedAt: number
  visible: boolean
}

export type EyeBreakDecision =
  /** Nothing to do yet. */
  | { type: 'wait' }
  /** Due during quiet hours: start the next interval without a prompt or a log row (AC23.3). */
  | { type: 'skip' }
  /** Show a prompt. `missed`: it came due while Taskuda was in the background (AC28.5). */
  | { type: 'prompt'; missed: boolean }

/** When the current eye-break window opened: today, or yesterday for the overnight part of a range. */
function windowOpenedAt(now: Date, settings: EyeBreakSettings): number {
  const start = timeToMinutes(settings.start)
  const opened = new Date(now)
  opened.setHours(Math.floor(start / 60), start % 60, 0, 0)
  if (now.getHours() * 60 + now.getMinutes() < start) opened.setDate(opened.getDate() - 1)
  return opened.getTime()
}

/** When the next prompt is due: a snooze, or one interval after the latest of the last prompt, the window opening and app open. */
export function nextEyeBreakAt(state: EyeBreakState): number {
  if (state.snoozedUntil !== null) return state.snoozedUntil
  const from = Math.max(
    state.lastPromptAt ?? 0,
    state.openedAt,
    windowOpenedAt(new Date(state.now), state.settings),
  )
  return from + state.settings.intervalMinutes * 60_000
}

/**
 * PRD FR28: prompts on working days, inside eye-break hours, while Taskuda is open (AC28.2), never
 * during quiet hours (AC28.4). A prompt that came due in the background waits until the user is
 * back, then shows once as missed (AC28.5).
 */
export function decideEyeBreak(state: EyeBreakState): EyeBreakDecision {
  const now = new Date(state.now)
  const { settings } = state
  if (!settings.enabled) return { type: 'wait' }
  if (!isWorkingDay(toDayKey(now), state.workingDays)) return { type: 'wait' }
  if (!isInTimeRange(now, settings)) return { type: 'wait' }

  const dueAt = nextEyeBreakAt(state)
  if (state.now < dueAt || !state.visible) return { type: 'wait' }
  if (isInQuietHours(now, state.quietHours)) return { type: 'skip' }
  return { type: 'prompt', missed: state.now - dueAt > ON_TIME_TOLERANCE_MS }
}
