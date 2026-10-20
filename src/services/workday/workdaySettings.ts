import { ValidationError } from '@/services/db/errors'
import { getSetting, setSetting } from '@/services/db/settingsRepository'
import {
  DEFAULT_CLOSEOUT_REMINDER,
  DEFAULT_QUIET_HOURS,
  DEFAULT_WORKING_DAYS,
  WEEKDAYS,
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
    typeof start === 'string' && typeof end === 'string' && isValidTime(start) && isValidTime(end) && start !== end
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

export async function getWorkdaySettings(): Promise<WorkdaySettings> {
  const [workingDays, closeoutReminder, quietHours] = await Promise.all([
    getWorkingDays(),
    getCloseoutReminder(),
    getQuietHours(),
  ])
  return { workingDays, closeoutReminder, quietHours }
}
