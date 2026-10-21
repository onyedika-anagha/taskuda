import type { NewTaskInput, Task, TaskPatch, TaskStatus, TimeBlock } from '@/types/task'
import { TIME_BLOCKS } from '@/types/task'
import { isValidDayKey } from '@/utils/dates'
import { blockForTime, isValidTime } from '@/utils/timeBlocks'
import { appendActivity } from './activityLogRepository'
import { db } from './database'
import { RecordNotFoundError, ValidationError } from './errors'

export const TASK_TITLE_MAX_LENGTH = 200
const ORDER_STEP = 1000

const BLOCK_RANK: Record<TimeBlock, number> = { morning: 0, afternoon: 1, evening: 2 }

function cleanTitle(title: string): string {
  const trimmed = title.trim()
  if (!trimmed) throw new ValidationError('Give the task a title.')
  if (trimmed.length > TASK_TITLE_MAX_LENGTH) {
    throw new ValidationError(`Keep the title under ${TASK_TITLE_MAX_LENGTH} characters.`)
  }
  return trimmed
}

function checkStartTime(startTime: string | null | undefined): void {
  if (startTime != null && !isValidTime(startTime)) throw new ValidationError('Use a valid start time.')
}

function checkDuration(durationMinutes: number | null | undefined): void {
  if (durationMinutes != null && (!Number.isInteger(durationMinutes) || durationMinutes <= 0)) {
    throw new ValidationError('Duration must be a whole number of minutes.')
  }
}

/** A due time needs a due date (PRD AC30.1). */
function checkDue(dueDate: string | null | undefined, dueTime: string | null | undefined): void {
  if (dueDate != null && !isValidDayKey(dueDate)) throw new ValidationError('Use a valid due date.')
  if (dueTime != null && !isValidTime(dueTime)) throw new ValidationError('Use a valid due time.')
  if (dueTime != null && dueDate == null) throw new ValidationError('Pick a due date for this time.')
}

async function getTaskOrThrow(id: string): Promise<Task> {
  const task = await db.tasks.get(id)
  if (!task) throw new RecordNotFoundError('Task', id)
  return task
}

function blockTasks(dayKey: string, block: TimeBlock): Promise<Task[]> {
  return db.tasks.where('[dayKey+block]').equals([dayKey, block]).sortBy('order')
}

async function nextOrder(dayKey: string, block: TimeBlock): Promise<number> {
  const tasks = await blockTasks(dayKey, block)
  return tasks.length ? tasks[tasks.length - 1].order + ORDER_STEP : ORDER_STEP
}

export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => BLOCK_RANK[a.block] - BLOCK_RANK[b.block] || a.order - b.order)
}

export async function listTasksForDay(dayKey: string): Promise<Task[]> {
  return sortTasks(await db.tasks.where('dayKey').equals(dayKey).toArray())
}

export function getTask(id: string): Promise<Task | undefined> {
  return db.tasks.get(id)
}

export async function createTask(input: NewTaskInput): Promise<Task> {
  if (!isValidDayKey(input.dayKey)) throw new ValidationError('Invalid day.')
  if (!TIME_BLOCKS.includes(input.block)) throw new ValidationError('Invalid time of day.')
  checkStartTime(input.startTime)
  checkDuration(input.durationMinutes)
  checkDue(input.dueDate, input.dueTime)
  const title = cleanTitle(input.title)

  return db.transaction('rw', db.tasks, db.activityLog, async () => {
    const now = Date.now()
    const task: Task = {
      id: crypto.randomUUID(),
      title,
      notes: input.notes?.trim() ?? '',
      companyId: input.companyId ?? null,
      dayKey: input.dayKey,
      block: input.block,
      order: await nextOrder(input.dayKey, input.block),
      startTime: input.startTime ?? null,
      durationMinutes: input.durationMinutes ?? null,
      status: 'todo',
      carriedOverCount: 0,
      carriedFromTaskId: null,
      carriedToTaskId: null,
      source: input.source ?? 'manual',
      jiraIssue: input.jiraIssue ?? null,
      seriesId: input.seriesId ?? null,
      dueDate: input.dueDate ?? null,
      dueTime: input.dueDate ? (input.dueTime ?? null) : null,
      createdAt: now,
      updatedAt: now,
    }
    await db.tasks.add(task)
    await appendActivity('task_created', task.id, task.dayKey)
    return task
  })
}

export async function updateTask(id: string, patch: TaskPatch): Promise<Task> {
  const changes: TaskPatch = { ...patch }
  if (changes.title !== undefined) changes.title = cleanTitle(changes.title)
  if (changes.notes !== undefined) changes.notes = changes.notes.trim()
  checkStartTime(changes.startTime)
  checkDuration(changes.durationMinutes)

  return db.transaction('rw', db.tasks, db.activityLog, async () => {
    const task = await getTaskOrThrow(id)
    const updated: Task = { ...task, ...changes, updatedAt: Date.now() }
    if (changes.dueDate !== undefined || changes.dueTime !== undefined)
      checkDue(updated.dueDate, updated.dueTime)
    await db.tasks.put(updated)
    await appendActivity('task_updated', id, task.dayKey, { fields: Object.keys(changes) })
    return updated
  })
}

export async function setTaskStatus(id: string, status: TaskStatus): Promise<Task> {
  return db.transaction('rw', db.tasks, db.activityLog, async () => {
    const task = await getTaskOrThrow(id)
    if (task.status === status) return task
    const updated: Task = { ...task, status, updatedAt: Date.now() }
    await db.tasks.put(updated)
    await appendActivity('task_status_changed', id, task.dayKey, { from: task.status, to: status })
    return updated
  })
}

/**
 * Moves a task to `toIndex` within `toBlock` on the same day and renumbers that block.
 * Pass `clearStartTime` when the user chose "Remove time and move" (design D2).
 */
export async function moveTask(
  id: string,
  toBlock: TimeBlock,
  toIndex: number,
  options: { clearStartTime?: boolean } = {},
): Promise<Task> {
  return db.transaction('rw', db.tasks, db.activityLog, async () => {
    const task = await getTaskOrThrow(id)
    const siblings = (await blockTasks(task.dayKey, toBlock)).filter((t) => t.id !== id)
    const index = Math.max(0, Math.min(toIndex, siblings.length))
    const moved: Task = {
      ...task,
      block: toBlock,
      startTime: options.clearStartTime ? null : task.startTime,
      updatedAt: Date.now(),
    }
    siblings.splice(index, 0, moved)
    const renumbered = siblings.map((t, i) => ({ ...t, order: (i + 1) * ORDER_STEP }))
    await db.tasks.bulkPut(renumbered)
    await appendActivity('task_moved', id, task.dayKey, {
      fromBlock: task.block,
      toBlock,
      toIndex: index,
      ...(options.clearStartTime ? { clearedStartTime: true } : {}),
    })
    return renumbered[index]
  })
}

/** What `deleteTask` removed, so the delete can be undone (PRD FR18). */
export interface DeletedTask {
  task: Task
  /** The task had a calendar event when it was deleted. */
  hadCalendarEvent: boolean
}

/**
 * Deletes a task. If it's linked to a calendar event, the link is kept as a tombstone so the next
 * calendar sync can delete the event too (PRD AC8.4).
 */
export async function deleteTask(id: string): Promise<DeletedTask> {
  return db.transaction('rw', db.tasks, db.activityLog, db.calendarMappings, async () => {
    const task = await getTaskOrThrow(id)
    await db.tasks.delete(id)
    const mapping = await db.calendarMappings.get(id)
    if (mapping) await db.calendarMappings.put({ ...mapping, taskDeleted: true, updatedAt: Date.now() })
    await appendActivity('task_deleted', id, task.dayKey, { title: task.title })
    return { task, hadCalendarEvent: !!mapping }
  })
}

/**
 * Undoes `deleteTask`: the task comes back with the same id and position (PRD AC18.2, AC18.3).
 *
 * Calendar (AC18.4): if the sync hasn't deleted the event yet, the tombstone is cleared and the task
 * keeps its event. If it has, the task is pushed as a new event at the next sync; a calendar-sourced
 * task becomes a Taskuda task for that, because unlinked calendar tasks are never pushed.
 */
export async function restoreTask({ task, hadCalendarEvent }: DeletedTask): Promise<Task> {
  return db.transaction('rw', db.tasks, db.activityLog, db.calendarMappings, async () => {
    const existing = await db.tasks.get(task.id)
    if (existing) return existing

    const now = Date.now()
    const mapping = await db.calendarMappings.get(task.id)
    const eventGone = hadCalendarEvent && !mapping
    const restored: Task = {
      ...task,
      source: eventGone && task.startTime ? 'manual' : task.source,
      updatedAt: now,
    }
    if (mapping?.taskDeleted) {
      const { taskDeleted: _tombstone, ...link } = mapping
      await db.calendarMappings.put({ ...link, updatedAt: now })
    }
    await db.tasks.add(restored)
    await appendActivity('task_restored', task.id, task.dayKey, { title: task.title })
    return restored
  })
}

/** The event was deleted in Google Calendar: remove the task and its link (no tombstone). */
export async function deleteTaskForRemovedEvent(id: string): Promise<void> {
  await db.transaction('rw', db.tasks, db.activityLog, db.calendarMappings, async () => {
    const task = await db.tasks.get(id)
    await db.calendarMappings.delete(id)
    if (!task) return
    await db.tasks.delete(id)
    await appendActivity('task_deleted', id, task.dayKey, { title: task.title, source: 'calendar' })
  })
}

export interface CalendarTaskChange {
  title: string
  dayKey: string
  startTime: string
  durationMinutes: number | null
}

/** Applies an edit made in Google Calendar; a new day or time moves the task to the matching block. */
export async function applyCalendarChange(id: string, change: CalendarTaskChange): Promise<Task> {
  if (!isValidDayKey(change.dayKey)) throw new ValidationError('Invalid day.')
  checkStartTime(change.startTime)
  return db.transaction('rw', db.tasks, db.activityLog, async () => {
    const task = await getTaskOrThrow(id)
    const block = blockForTime(change.startTime)
    const moved = block !== task.block || change.dayKey !== task.dayKey
    const updated: Task = {
      ...task,
      title: cleanTitle(change.title),
      dayKey: change.dayKey,
      block,
      startTime: change.startTime,
      durationMinutes: change.durationMinutes,
      order: moved ? await nextOrder(change.dayKey, block) : task.order,
      updatedAt: Date.now(),
    }
    await db.tasks.put(updated)
    await appendActivity('task_updated', id, updated.dayKey, { source: 'calendar' })
    return updated
  })
}

/**
 * Copies an unfinished task to `toDayKey` in the same block, keeping its status (PRD AC11.1).
 * The original stays on its day, linked to the copy, so that day's report can list it as carried over.
 * The copy keeps `seriesId` (PRD AC20.4).
 */
export async function carryOverTask(id: string, toDayKey: string): Promise<Task> {
  if (!isValidDayKey(toDayKey)) throw new ValidationError('Invalid day.')

  return db.transaction('rw', db.tasks, db.activityLog, async () => {
    const task = await getTaskOrThrow(id)
    if (task.status === 'done') throw new ValidationError('Done tasks are not carried over.')
    if (task.carriedToTaskId) return getTaskOrThrow(task.carriedToTaskId)

    const now = Date.now()
    // A day never shows two tasks from one series (PRD AC20.4): if the next day already has its
    // occurrence, the task is carried onto that occurrence instead of being copied.
    const occurrence = task.seriesId
      ? await db.tasks.where('[seriesId+dayKey]').equals([task.seriesId, toDayKey]).first()
      : undefined
    if (occurrence) {
      const merged: Task = {
        ...occurrence,
        carriedOverCount: Math.max(occurrence.carriedOverCount, task.carriedOverCount + 1),
        carriedFromTaskId: occurrence.carriedFromTaskId ?? task.id,
        updatedAt: now,
      }
      await db.tasks.put(merged)
      await db.tasks.put({ ...task, carriedToTaskId: occurrence.id, updatedAt: now })
      await appendActivity('task_carried_over', task.id, task.dayKey, { toDayKey, newTaskId: occurrence.id })
      return merged
    }

    const copy: Task = {
      ...task,
      id: crypto.randomUUID(),
      dayKey: toDayKey,
      order: await nextOrder(toDayKey, task.block),
      carriedOverCount: task.carriedOverCount + 1,
      carriedFromTaskId: task.id,
      carriedToTaskId: null,
      createdAt: now,
      updatedAt: now,
    }
    await db.tasks.add(copy)
    await db.tasks.put({ ...task, carriedToTaskId: copy.id, updatedAt: now })
    await appendActivity('task_carried_over', task.id, task.dayKey, { toDayKey, newTaskId: copy.id })
    await appendActivity('task_created', copy.id, toDayKey, { carriedFromTaskId: task.id })
    return copy
  })
}
