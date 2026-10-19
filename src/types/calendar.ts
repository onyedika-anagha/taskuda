export interface CalendarMapping {
  taskId: string
  eventId: string
  calendarId: string
  /** Google's etag for the last version we saw. */
  etag: string | null
  /** When this mapping was last written. */
  updatedAt: number
  /** The task's `updatedAt` at the last sync; later edits are pushed. */
  taskUpdatedAt: number
  /** The event's `updated` time (ms) at the last sync; later edits are pulled. */
  eventUpdatedAt: number
  /** The task was deleted here; the next sync deletes the event and then this mapping. */
  taskDeleted?: boolean
}

export interface CalendarListEntry {
  id: string
  summary: string
  primary: boolean
}

/** The fields of a Google Calendar event that Taskuda reads. */
export interface CalendarEvent {
  id: string
  status: 'confirmed' | 'tentative' | 'cancelled'
  summary?: string
  description?: string
  updated: string
  etag?: string
  start?: { dateTime?: string; date?: string; timeZone?: string }
  end?: { dateTime?: string; date?: string; timeZone?: string }
  extendedProperties?: { private?: Record<string, string> }
}

export type CalendarSyncStatus =
  | { state: 'loading' }
  | { state: 'off' }
  | { state: 'idle'; lastSyncAt: number | null }
  | { state: 'syncing' }
  | { state: 'reconnect' }
  | { state: 'paused'; reason: string }
