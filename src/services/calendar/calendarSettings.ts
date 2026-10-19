import { getSetting, setSetting } from '@/services/db/settingsRepository'

/**
 * Calendar sync state. The `google.` prefix keeps it on this device (never backed up), because
 * the sync token describes what *this* device has already seen.
 */
const KEYS = {
  enabled: 'google.calendar.enabled',
  calendarId: 'google.calendar.id',
  calendarName: 'google.calendar.name',
  syncToken: 'google.calendar.syncToken',
  lastSyncAt: 'google.calendar.lastSyncAt',
} as const

export interface CalendarSettings {
  enabled: boolean
  calendarId: string | null
  calendarName: string | null
  syncToken: string | null
  lastSyncAt: number | null
}

export async function getCalendarSettings(): Promise<CalendarSettings> {
  const [enabled, calendarId, calendarName, syncToken, lastSyncAt] = await Promise.all([
    getSetting(KEYS.enabled, false),
    getSetting<string | null>(KEYS.calendarId, null),
    getSetting<string | null>(KEYS.calendarName, null),
    getSetting<string | null>(KEYS.syncToken, null),
    getSetting<number | null>(KEYS.lastSyncAt, null),
  ])
  return { enabled, calendarId, calendarName, syncToken, lastSyncAt }
}

export const setCalendarEnabled = (enabled: boolean) => setSetting(KEYS.enabled, enabled)
export const setSyncToken = (token: string | null) => setSetting(KEYS.syncToken, token)
export const setLastSyncAt = (at: number) => setSetting(KEYS.lastSyncAt, at)

export async function setSyncCalendar(calendarId: string, calendarName: string): Promise<void> {
  await setSetting(KEYS.calendarId, calendarId)
  await setSetting(KEYS.calendarName, calendarName)
}
