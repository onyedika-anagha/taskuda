export interface CalendarMapping {
  taskId: string
  eventId: string
  calendarId: string
  /** Google's etag for the last version we saw, used to detect remote changes. */
  etag: string | null
  updatedAt: number
}
