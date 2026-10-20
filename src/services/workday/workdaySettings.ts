import { ValidationError } from '@/services/db/errors'
import { getSetting, setSetting } from '@/services/db/settingsRepository'
import { DEFAULT_WORKING_DAYS, WEEKDAYS, type Weekday } from '@/types/workday'

/** Not `device.`: working days follow the user to a new device through the backup. */
const KEYS = {
  workingDays: 'workday.workingDays',
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
