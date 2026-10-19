import { create } from 'zustand'
import {
  getCalendarSettings,
  setCalendarEnabled,
  setSyncCalendar,
  setSyncToken,
} from '@/services/calendar/calendarSettings'
import { runCalendarSync } from '@/services/calendar/calendarSync'
import { db } from '@/services/db/database'
import { CALENDAR_SCOPES, listOwnedCalendars } from '@/services/google/calendarApi'
import { GoogleApiError } from '@/services/google/googleApi'
import { GoogleAuthError, getAccessToken } from '@/services/google/googleAuth'
import type { CalendarListEntry, CalendarSyncStatus } from '@/types/calendar'

/** After local edits, wait a little so a burst of changes syncs once (AC8.1: within 1 minute). */
export const CALENDAR_DEBOUNCE_MS = 10_000

interface CalendarState {
  status: CalendarSyncStatus
  calendarId: string | null
  calendarName: string | null
  calendars: CalendarListEntry[]
  init: () => Promise<void>
  /** From a click: consent, pick the primary calendar, first sync (design F9.1). */
  connect: () => Promise<void>
  /** From a click: load the user's calendars for the picker. */
  loadCalendars: () => Promise<void>
  /** Switching calendars starts fresh; events already added stay in the old calendar. */
  chooseCalendar: (calendar: CalendarListEntry) => Promise<void>
  /** "Turn off sync": existing tasks stay; nothing is deleted (design F9.3). */
  turnOff: () => Promise<void>
  syncNow: (options?: { interactive?: boolean }) => Promise<void>
  scheduleSync: () => void
}

let timer: ReturnType<typeof setTimeout> | undefined
let running = false

function pauseReason(error: unknown): string {
  if (error instanceof GoogleApiError) {
    if (error.kind === 'quota') return 'Google Calendar is busy right now'
    if (error.kind === 'network') return 'the connection failed'
    if (error.kind === 'not-found') return 'the calendar wasn’t found'
    return 'Google Calendar returned an error'
  }
  if (error instanceof GoogleAuthError && error.kind === 'not-configured') {
    return 'Google sign-in isn’t set up for this copy of Taskuda'
  }
  return 'something unexpected happened'
}

function needsClick(error: unknown): boolean {
  return (
    (error instanceof GoogleAuthError &&
      ['interaction-required', 'popup-closed', 'denied'].includes(error.kind)) ||
    (error instanceof GoogleApiError && error.kind === 'auth-expired')
  )
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  status: { state: 'loading' },
  calendarId: null,
  calendarName: null,
  calendars: [],

  init: async () => {
    const settings = await getCalendarSettings()
    set({
      calendarId: settings.calendarId,
      calendarName: settings.calendarName,
      status: settings.enabled ? { state: 'idle', lastSyncAt: settings.lastSyncAt } : { state: 'off' },
    })
  },

  connect: async () => {
    await getAccessToken(CALENDAR_SCOPES, { interactive: true })
    const calendars = await listOwnedCalendars()
    const primary = calendars.find((c) => c.primary) ?? calendars[0]
    if (!primary) throw new GoogleApiError('not-found')
    set({ calendars })
    await get().chooseCalendar(primary)
  },

  loadCalendars: async () => {
    set({ calendars: await listOwnedCalendars({ interactive: true }) })
  },

  chooseCalendar: async (calendar) => {
    if (calendar.id !== get().calendarId) {
      // A different calendar: forget links and the sync token so nothing points at the old one.
      await db.calendarMappings.clear()
      await setSyncToken(null)
    }
    await setSyncCalendar(calendar.id, calendar.summary)
    await setCalendarEnabled(true)
    set({
      calendarId: calendar.id,
      calendarName: calendar.summary,
      status: { state: 'idle', lastSyncAt: null },
    })
    await get().syncNow({ interactive: true })
  },

  turnOff: async () => {
    clearTimeout(timer)
    await setCalendarEnabled(false)
    set({ status: { state: 'off' } })
  },

  syncNow: async ({ interactive = false } = {}) => {
    if (get().status.state === 'off' || running) return
    clearTimeout(timer)
    if (!navigator.onLine) return
    running = true
    set({ status: { state: 'syncing' } })
    try {
      if (interactive) await getAccessToken(CALENDAR_SCOPES, { interactive: true })
      await runCalendarSync()
      const { lastSyncAt } = await getCalendarSettings()
      set({ status: { state: 'idle', lastSyncAt } })
    } catch (error) {
      set({
        status: needsClick(error) ? { state: 'reconnect' } : { state: 'paused', reason: pauseReason(error) },
      })
    } finally {
      running = false
    }
  },

  scheduleSync: () => {
    // Changes made by the sync itself don't schedule another run.
    if (running || get().status.state === 'off' || get().status.state === 'loading') return
    clearTimeout(timer)
    timer = setTimeout(() => void get().syncNow(), CALENDAR_DEBOUNCE_MS)
  },
}))
