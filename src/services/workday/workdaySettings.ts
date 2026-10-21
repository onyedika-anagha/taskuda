import { ValidationError } from '@/services/db/errors'
import { getSetting, setSetting } from '@/services/db/settingsRepository'
import {
  BUDGET_HOURS,
  DEFAULT_CLOSEOUT_REMINDER,
  DEFAULT_EYE_BREAKS,
  DEFAULT_QUIET_HOURS,
  DEFAULT_WORKING_DAYS,
  EYE_BREAK_INTERVALS,
  WEEKDAYS,
  type BudgetHours,
  type EyeBreakSettings,
  type QuietHours,
  type Weekday,
  type WorkdaySettings,
} from '@/types/workday'
import { isValidTime } from '@/utils/timeBlocks'

/** Not `device.`: these follow the user to a new device through the backup. */
const KEYS = {
  workingDays: 'workday.workingDays',
  closeoutReminder: 'workday.closeoutReminder',
  quietHours: 'workday.quietHours',
  eyeBreaks: 'workday.eyeBreaks',
  dailyBudgetHours: 'workday.dailyBudgetHours',
} as const

/** Valid, unique weekdays in display order; anything else in storage is dropped. */
export function normalizeWorkingDays(value: unknown): Weekday[] {
  if (!Array.isArray(value)) return []
  return WEEKDAYS.filter((day) => value.includes(day))
}

export async function getWorkingDays(): Promise<Weekday[]> {
  const days = normalizeWorkingDays(await getSetting<unknown>(KEYS.workingDays, DEFAULT_WORKING_DAYS))
  return days.length ? days : [...DEFAULT_WORKING_DAYS]
}

/** PRD AC19.1: at least one working day. */
export async function setWorkingDays(days: readonly Weekday[]): Promise<void> {
  const clean = normalizeWorkingDays(days)
  if (!clean.length) throw new ValidationError('Keep at least one working day.')
  await setSetting(KEYS.workingDays, clean)
}

/** PRD AC21.1: a time, or `null` for Off. */
export async function getCloseoutReminder(): Promise<string | null> {
  const value = await getSetting<unknown>(KEYS.closeoutReminder, DEFAULT_CLOSEOUT_REMINDER)
  if (value === null) return null
  return typeof value === 'string' && isValidTime(value) ? value : DEFAULT_CLOSEOUT_REMINDER
}

export async function setCloseoutReminder(time: string | null): Promise<void> {
  if (time !== null && !isValidTime(time)) throw new ValidationError('Use a valid time.')
  await setSetting(KEYS.closeoutReminder, time)
}

function checkRange(start: string, end: string): void {
  if (!isValidTime(start) || !isValidTime(end)) throw new ValidationError('Use a valid time.')
  if (start === end) throw new ValidationError('Start and end can’t be the same.')
}

export async function getQuietHours(): Promise<QuietHours> {
  const value = await getSetting<Partial<QuietHours> | null>(KEYS.quietHours, null)
  if (!value || typeof value !== 'object') return { ...DEFAULT_QUIET_HOURS }
  const { start, end } = value
  const validRange =
    typeof start === 'string' &&
    typeof end === 'string' &&
    isValidTime(start) &&
    isValidTime(end) &&
    start !== end
  return validRange
    ? { enabled: value.enabled === true, start, end }
    : { ...DEFAULT_QUIET_HOURS, enabled: value.enabled === true }
}

/** PRD AC23.1: the range may cross midnight, but start and end can't be equal. */
export async function setQuietHours(quietHours: QuietHours): Promise<void> {
  checkRange(quietHours.start, quietHours.end)
  await setSetting(KEYS.quietHours, {
    enabled: quietHours.enabled,
    start: quietHours.start,
    end: quietHours.end,
  })
}

function isEyeBreakInterval(value: unknown): value is EyeBreakSettings['intervalMinutes'] {
  return EYE_BREAK_INTERVALS.includes(value as EyeBreakSettings['intervalMinutes'])
}

/** PRD AC28.1: off by default, every 20 minutes, 9:00 AM–5:00 PM. Bad stored values fall back. */
export async function getEyeBreaks(): Promise<EyeBreakSettings> {
  const value = await getSetting<Partial<EyeBreakSettings> | null>(KEYS.eyeBreaks, null)
  if (!value || typeof value !== 'object') return { ...DEFAULT_EYE_BREAKS }
  const { start, end } = value
  const validRange =
    typeof start === 'string' &&
    typeof end === 'string' &&
    isValidTime(start) &&
    isValidTime(end) &&
    start !== end
  return {
    enabled: value.enabled === true,
    intervalMinutes: isEyeBreakInterval(value.intervalMinutes)
      ? value.intervalMinutes
      : DEFAULT_EYE_BREAKS.intervalMinutes,
    start: validRange ? start : DEFAULT_EYE_BREAKS.start,
    end: validRange ? end : DEFAULT_EYE_BREAKS.end,
  }
}

export async function setEyeBreaks(eyeBreaks: EyeBreakSettings): Promise<void> {
  checkRange(eyeBreaks.start, eyeBreaks.end)
  if (!isEyeBreakInterval(eyeBreaks.intervalMinutes)) throw new ValidationError('Pick an interval.')
  await setSetting(KEYS.eyeBreaks, {
    enabled: eyeBreaks.enabled,
    intervalMinutes: eyeBreaks.intervalMinutes,
    start: eyeBreaks.start,
    end: eyeBreaks.end,
  })
}

/** PRD AC29.2: 1–4 hours, or `null` for Off (the default). */
export async function getDailyBudgetHours(): Promise<BudgetHours | null> {
  const value = await getSetting<unknown>(KEYS.dailyBudgetHours, null)
  return BUDGET_HOURS.includes(value as BudgetHours) ? (value as BudgetHours) : null
}

export async function setDailyBudgetHours(hours: BudgetHours | null): Promise<void> {
  if (hours !== null && !BUDGET_HOURS.includes(hours)) throw new ValidationError('Pick a budget.')
  await setSetting(KEYS.dailyBudgetHours, hours)
}

export async function getWorkdaySettings(): Promise<WorkdaySettings> {
  const [workingDays, closeoutReminder, quietHours, eyeBreaks, dailyBudgetHours] = await Promise.all([
    getWorkingDays(),
    getCloseoutReminder(),
    getQuietHours(),
    getEyeBreaks(),
    getDailyBudgetHours(),
  ])
  return { workingDays, closeoutReminder, quietHours, eyeBreaks, dailyBudgetHours }
}
