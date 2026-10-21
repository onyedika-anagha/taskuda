import { getWorkingDays } from '@/services/workday/workdaySettings'
import type { RecurringSeries, RepeatPattern, SeriesTemplate } from '@/types/recurring'
import type { Task, TaskPatch, TimeBlock } from '@/types/task'
import { todayKey } from '@/utils/dates'
import { seriesFallsOn } from '@/utils/recurrence'
import { db } from './database'
import { RecordNotFoundError, ValidationError } from './errors'
import { createTask, deleteTask, getTask, restoreTask, updateTask, type DeletedTask } from './taskRepository'

/** Tables every series write touches (task deletes keep calendar tombstones). */
const TABLES = [db.tasks, db.activityLog, db.calendarMappings, db.recurringSeries]
/** Upper bound for `[seriesId+dayKey]` ranges. */
const LAST_DAY = '9999-12-31'

export function getSeries(id: string): Promise<RecurringSeries | undefined> {
  return db.recurringSeries.get(id)
}

async function getSeriesOrThrow(id: string | null): Promise<RecurringSeries> {
  const series = id ? await db.recurringSeries.get(id) : undefined
  if (!series) throw new RecordNotFoundError('Series', id ?? '')
  return series
}

function checkPattern(pattern: RepeatPattern): void {
  if (pattern.kind === 'weekly' && !pattern.weekdays.length)
    throw new ValidationError('Pick at least one day.')
  if (pattern.kind === 'monthly' && !(pattern.dayOfMonth >= 1 && pattern.dayOfMonth <= 31)) {
    throw new ValidationError('Pick a day of the month.')
  }
}

function templateOf(task: Task): SeriesTemplate {
  const { title, notes, companyId, block, startTime, durationMinutes, jiraIssue } = task
  return { title, notes, companyId, block, startTime, durationMinutes, jiraIssue }
}

/** An occurrence the user hasn't changed: still To Do, never edited or carried. */
function isUntouched(task: Task): boolean {
  return task.status === 'todo' && task.updatedAt === task.createdAt && task.carriedOverCount === 0
}

/** The series' tasks after `dayKey`. */
function tasksAfter(seriesId: string, dayKey: string): Promise<Task[]> {
  return db.tasks
    .where('[seriesId+dayKey]')
    .between([seriesId, dayKey], [seriesId, LAST_DAY], false, true)
    .toArray()
}

function newSeries(template: SeriesTemplate, pattern: RepeatPattern, startDayKey: string): RecurringSeries {
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    ...template,
    pattern,
    startDayKey,
    endedFromDayKey: null,
    skippedDayKeys: [],
    createdAt: now,
    updatedAt: now,
  }
}

/** Makes `task` the first occurrence of a new series that starts on its day (design F14.3). */
export async function startSeries(taskId: string, pattern: RepeatPattern): Promise<RecurringSeries> {
  checkPattern(pattern)
  return db.transaction('rw', TABLES, async () => {
    const task = await getTask(taskId)
    if (!task) throw new RecordNotFoundError('Task', taskId)
    const series = newSeries(templateOf(task), pattern, task.dayKey)
    await db.recurringSeries.add(series)
    await db.tasks.update(task.id, { seriesId: series.id })
    return series
  })
}

/**
 * Adds the day's occurrences (PRD AC20.2–AC20.4): never on past days, never a second task from a
 * series that already has one there (including a carried-over copy), and safe to run twice.
 * Returns how many were created.
 */
export async function ensureOccurrences(dayKey: string, today = todayKey()): Promise<number> {
  if (dayKey < today) return 0
  const workingDays = await getWorkingDays()
  return db.transaction('rw', TABLES, async () => {
    let created = 0
    for (const series of await db.recurringSeries.toArray()) {
      if (!seriesFallsOn(series, dayKey, workingDays)) continue
      if (await db.tasks.where('[seriesId+dayKey]').equals([series.id, dayKey]).count()) continue
      const { title, notes, companyId, block, startTime, durationMinutes, jiraIssue } = series
      await createTask({
        title,
        notes,
        companyId,
        block,
        startTime,
        durationMinutes,
        jiraIssue,
        dayKey,
        seriesId: series.id,
      })
      created++
    }
    return created
  })
}

/**
 * "This and future tasks" (AC20.5): the series ends the day before this task, and when `pattern`
 * is set a new series with the changes starts on this task's day. Past days never change.
 * Later occurrences the user hasn't touched are removed and come back from the new series when
 * their day is shown; touched ones keep their changes and move to the new series. With `pattern`
 * `null` the task stops repeating. The caller saves the task's own fields (and block) as usual.
 */
export async function changeSeriesFrom(
  task: Task,
  patch: TaskPatch,
  block: TimeBlock,
  pattern: RepeatPattern | null,
): Promise<void> {
  if (pattern) checkPattern(pattern)
  const workingDays = await getWorkingDays()
  await db.transaction('rw', TABLES, async () => {
    const old = await getSeriesOrThrow(task.seriesId)
    const now = Date.now()
    const endsAt =
      old.endedFromDayKey !== null && old.endedFromDayKey < task.dayKey ? old.endedFromDayKey : task.dayKey
    await db.recurringSeries.put({ ...old, endedFromDayKey: endsAt, updatedAt: now })

    let next: RecurringSeries | null = null
    if (pattern) {
      next = {
        ...newSeries({ ...templateOf(task), ...patch, block }, pattern, task.dayKey),
        endedFromDayKey:
          old.endedFromDayKey !== null && old.endedFromDayKey > task.dayKey ? old.endedFromDayKey : null,
        skippedDayKeys: old.skippedDayKeys.filter((day) => day > task.dayKey),
      }
      await db.recurringSeries.add(next)
    }

    for (const later of await tasksAfter(old.id, task.dayKey)) {
      if (isUntouched(later)) await deleteTask(later.id)
      else {
        const keep = next !== null && seriesFallsOn(next, later.dayKey, workingDays)
        await db.tasks.update(later.id, { seriesId: keep && next ? next.id : null })
      }
    }
    await updateTask(task.id, patch)
    await db.tasks.update(task.id, { seriesId: next?.id ?? null })
  })
}

/** What a repeating delete removed, so Undo brings it all back (FR18, design F14.5). */
export interface DeletedOccurrences {
  deleted: DeletedTask[]
  /** The series before "This and future tasks" ended it; `null` for "This task only". */
  seriesBefore: RecurringSeries | null
}

export type RepeatScope = 'this' | 'future'

/** D1 repeating variant (AC20.5). "future" stops the series from this day and deletes its later tasks. */
export async function deleteOccurrence(task: Task, scope: RepeatScope): Promise<DeletedOccurrences> {
  return db.transaction('rw', TABLES, async () => {
    const series = await getSeriesOrThrow(task.seriesId)
    const now = Date.now()
    if (scope === 'this') {
      const deleted = await deleteTask(task.id)
      const skipped = series.skippedDayKeys.includes(task.dayKey)
        ? series.skippedDayKeys
        : [...series.skippedDayKeys, task.dayKey]
      await db.recurringSeries.put({ ...series, skippedDayKeys: skipped, updatedAt: now })
      return { deleted: [deleted], seriesBefore: null }
    }
    const deleted = [await deleteTask(task.id)]
    for (const later of await tasksAfter(series.id, task.dayKey)) deleted.push(await deleteTask(later.id))
    const endsAt =
      series.endedFromDayKey !== null && series.endedFromDayKey < task.dayKey
        ? series.endedFromDayKey
        : task.dayKey
    await db.recurringSeries.put({ ...series, endedFromDayKey: endsAt, updatedAt: now })
    return { deleted, seriesBefore: series }
  })
}

/** Undo for `deleteOccurrence`: the tasks come back, and so does the series (FR18). */
export async function restoreOccurrences({ deleted, seriesBefore }: DeletedOccurrences): Promise<void> {
  await db.transaction('rw', TABLES, async () => {
    if (seriesBefore) await db.recurringSeries.put({ ...seriesBefore, updatedAt: Date.now() })
    for (const item of deleted) await restoreTask(item)
  })
}
