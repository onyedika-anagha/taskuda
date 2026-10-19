import { listCompanies } from '@/services/db/companyRepository'
import {
  deleteMappingForTask,
  getMappingForEvent,
  listMappings,
  saveMapping,
} from '@/services/db/calendarMappingRepository'
import { db } from '@/services/db/database'
import {
  applyCalendarChange,
  createTask,
  deleteTaskForRemovedEvent,
  getTask,
} from '@/services/db/taskRepository'
import {
  SyncTokenExpiredError,
  deleteEvent,
  insertEvent,
  listEvents,
  patchEvent,
} from '@/services/google/calendarApi'
import { GoogleApiError } from '@/services/google/googleApi'
import type { CalendarEvent, CalendarMapping } from '@/types/calendar'
import type { Task } from '@/types/task'
import { addDaysToKey, fromDayKey, todayKey } from '@/utils/dates'
import { blockForTime } from '@/utils/timeBlocks'
import { getCalendarSettings, setLastSyncAt, setSyncToken } from './calendarSettings'
import { TASK_ID_PROPERTY, eventToTaskFields, eventUpdatedAt, taskToEvent } from './eventMapping'

/**
 * Two-way sync between timed tasks and one Google calendar (PRD FR8), run while the app is open.
 *
 * Each run pulls first (Google's changes since the last sync token), then pushes local changes.
 * Conflict rule (PRD RK6): when both sides changed since the last sync, the later edit wins,
 * comparing the task's `updatedAt` with the event's `updated` time.
 */

/** Tasks from a week ago onwards sync; older ones are history. */
const PAST_DAYS = 7
/** Events further ahead than this aren't pulled in as tasks. */
const FUTURE_DAYS = 90

export interface SyncSummary {
  pulled: number
  pushed: number
}

function windowStartKey(): string {
  return addDaysToKey(todayKey(), -PAST_DAYS)
}

function mappingFor(task: Task, event: CalendarEvent, calendarId: string): CalendarMapping {
  return {
    taskId: task.id,
    eventId: event.id,
    calendarId,
    etag: event.etag ?? null,
    updatedAt: Date.now(),
    taskUpdatedAt: task.updatedAt,
    eventUpdatedAt: eventUpdatedAt(event),
  }
}

/** Finds the mapping for an event, re-linking events Taskuda created if the mapping was lost. */
async function findMapping(event: CalendarEvent, calendarId: string): Promise<CalendarMapping | undefined> {
  const existing = await getMappingForEvent(event.id)
  if (existing) return existing
  const taskId = event.extendedProperties?.private?.[TASK_ID_PROPERTY]
  if (!taskId || !(await getTask(taskId))) return undefined
  // Both sides count as changed, so the later edit wins.
  const relinked: CalendarMapping = {
    taskId,
    eventId: event.id,
    calendarId,
    etag: null,
    updatedAt: Date.now(),
    taskUpdatedAt: 0,
    eventUpdatedAt: 0,
  }
  await saveMapping(relinked)
  return relinked
}

/** Returns true if a task was created, changed or deleted. */
async function applyRemoteEvent(event: CalendarEvent, calendarId: string): Promise<boolean> {
  const mapping = await findMapping(event, calendarId)
  const remoteAt = eventUpdatedAt(event)

  if (event.status === 'cancelled') {
    if (!mapping) return false
    const task = mapping.taskDeleted ? undefined : await getTask(mapping.taskId)
    if (!task) {
      await deleteMappingForTask(mapping.taskId)
      return false
    }
    const localChanged = task.updatedAt > mapping.taskUpdatedAt
    if (localChanged && task.updatedAt > remoteAt) {
      // Edited here after it was deleted there: keep the task; the push recreates the event.
      await deleteMappingForTask(task.id)
      return false
    }
    await deleteTaskForRemovedEvent(task.id)
    return true
  }

  const fields = eventToTaskFields(event)
  if (!mapping) {
    // A new event from the calendar (AC8.3). Events Taskuda made but no longer knows are ignored.
    if (!fields || event.extendedProperties?.private?.[TASK_ID_PROPERTY]) return false
    if (fields.dayKey < windowStartKey() || fields.dayKey > addDaysToKey(todayKey(), FUTURE_DAYS))
      return false
    const task = await createTask({
      title: fields.title,
      dayKey: fields.dayKey,
      block: blockForTime(fields.startTime),
      startTime: fields.startTime,
      durationMinutes: fields.durationMinutes,
      source: 'calendar',
    })
    await saveMapping(mappingFor(task, event, calendarId))
    return true
  }

  if (mapping.taskDeleted || remoteAt <= mapping.eventUpdatedAt) return false
  const task = await getTask(mapping.taskId)
  if (!task) {
    await deleteMappingForTask(mapping.taskId)
    return false
  }
  const localChanged = task.updatedAt > mapping.taskUpdatedAt
  if (localChanged && task.updatedAt >= remoteAt) return false // the local edit is newer; push wins
  if (!fields) {
    // Became an all-day event: keep the task, stop syncing it.
    await deleteMappingForTask(task.id)
    return false
  }
  const updated = await applyCalendarChange(task.id, fields)
  await saveMapping(mappingFor(updated, event, calendarId))
  return true
}

async function pull(
  calendarId: string,
  syncToken: string | null,
): Promise<{ changed: number; token: string | null }> {
  const timeMin = fromDayKey(windowStartKey()).toISOString()
  let page
  try {
    page = await listEvents(calendarId, { syncToken, timeMin })
  } catch (error) {
    if (!(error instanceof SyncTokenExpiredError)) throw error
    // The token expired: start over with a full sync (mappings keep this from duplicating anything).
    page = await listEvents(calendarId, { timeMin })
  }
  let changed = 0
  for (const event of page.events) if (await applyRemoteEvent(event, calendarId)) changed++
  return { changed, token: page.nextSyncToken }
}

async function push(calendarId: string): Promise<number> {
  let pushed = 0
  const mappings = await listMappings()

  // Tasks deleted here: delete their events, then forget the link (AC8.4).
  for (const mapping of mappings.filter((m) => m.taskDeleted)) {
    await deleteEvent(mapping.calendarId, mapping.eventId)
    await deleteMappingForTask(mapping.taskId)
    pushed++
  }

  const byTask = new Map(mappings.filter((m) => !m.taskDeleted).map((m) => [m.taskId, m]))
  const companyNames = new Map((await listCompanies()).map((c) => [c.id, c.name]))
  const tasks = await db.tasks.where('dayKey').aboveOrEqual(windowStartKey()).toArray()

  for (const task of tasks) {
    const mapping = byTask.get(task.id)
    const company = task.companyId ? companyNames.get(task.companyId) : undefined

    if (!mapping) {
      // New timed task (AC8.1). Calendar-sourced tasks that lost their link aren't pushed back.
      if (!task.startTime || task.source === 'calendar') continue
      const event = await insertEvent(
        calendarId,
        taskToEvent({ ...task, startTime: task.startTime }, company),
      )
      await saveMapping(mappingFor(task, event, calendarId))
      pushed++
      continue
    }
    if (task.updatedAt <= mapping.taskUpdatedAt) continue

    if (!task.startTime) {
      // The start time was removed: it's no longer a calendar event.
      await deleteEvent(mapping.calendarId, mapping.eventId)
      await deleteMappingForTask(task.id)
      pushed++
      continue
    }
    const body = taskToEvent({ ...task, startTime: task.startTime }, company)
    let event: CalendarEvent
    try {
      event = await patchEvent(mapping.calendarId, mapping.eventId, body) // AC8.2: same event, no duplicate
    } catch (error) {
      if (!(error instanceof GoogleApiError && error.kind === 'not-found')) throw error
      event = await insertEvent(calendarId, body)
    }
    await saveMapping(mappingFor(task, event, calendarId))
    pushed++
  }
  return pushed
}

/** One sync run. Does nothing when sync is off. */
export async function runCalendarSync(now = Date.now()): Promise<SyncSummary> {
  const settings = await getCalendarSettings()
  if (!settings.enabled || !settings.calendarId) return { pulled: 0, pushed: 0 }
  const { changed, token } = await pull(settings.calendarId, settings.syncToken)
  const pushed = await push(settings.calendarId)
  if (token) await setSyncToken(token)
  await setLastSyncAt(now)
  return { pulled: changed, pushed }
}
