import { beforeEach, describe, expect, it } from 'vitest'
import { resetDatabase } from '@/test/resetDatabase'
import { listActivityForTask } from './activityLogRepository'
import { db } from './database'
import { RecordNotFoundError, ValidationError } from './errors'
import {
  carryOverTask,
  createTask,
  deleteTask,
  getTask,
  listTasksForDay,
  moveTask,
  restoreTask,
  setTaskStatus,
  updateTask,
} from './taskRepository'

const DAY = '2026-10-19'
const NEXT_DAY = '2026-10-20'

async function titles(block?: string): Promise<string[]> {
  const tasks = await listTasksForDay(DAY)
  return tasks.filter((t) => !block || t.block === block).map((t) => t.title)
}

describe('taskRepository', () => {
  beforeEach(resetDatabase)

  describe('createTask', () => {
    it('AC2.1 creates a task with only a title, as To Do with defaults', async () => {
      const task = await createTask({ title: '  Write report  ', dayKey: DAY, block: 'morning' })
      expect(task).toMatchObject({
        title: 'Write report',
        status: 'todo',
        companyId: null,
        startTime: null,
        notes: '',
        carriedOverCount: 0,
        source: 'manual',
      })
      expect(await getTask(task.id)).toEqual(task)
    })

    it('rejects an empty title with the design-spec copy', async () => {
      await expect(createTask({ title: '   ', dayKey: DAY, block: 'morning' })).rejects.toThrow(
        new ValidationError('Give the task a title.'),
      )
    })

    it('rejects invalid start times, durations and days', async () => {
      await expect(
        createTask({ title: 'A', dayKey: DAY, block: 'morning', startTime: '9am' }),
      ).rejects.toThrow(ValidationError)
      await expect(
        createTask({ title: 'A', dayKey: DAY, block: 'morning', durationMinutes: -5 }),
      ).rejects.toThrow(ValidationError)
      await expect(createTask({ title: 'A', dayKey: 'tomorrow', block: 'morning' })).rejects.toThrow(
        ValidationError,
      )
    })

    it('appends new tasks to the end of their block', async () => {
      await createTask({ title: 'First', dayKey: DAY, block: 'morning' })
      await createTask({ title: 'Evening', dayKey: DAY, block: 'evening' })
      await createTask({ title: 'Second', dayKey: DAY, block: 'morning' })
      expect(await titles()).toEqual(['First', 'Second', 'Evening'])
    })

    it('logs a task_created event', async () => {
      const task = await createTask({ title: 'A', dayKey: DAY, block: 'morning' })
      expect((await listActivityForTask(task.id)).map((e) => e.type)).toEqual(['task_created'])
    })
  })

  describe('updateTask', () => {
    it('AC2.2 saves edits and logs which fields changed', async () => {
      const task = await createTask({ title: 'A', dayKey: DAY, block: 'morning' })
      const updated = await updateTask(task.id, { title: 'B', notes: ' details ', startTime: '09:30' })
      expect(updated).toMatchObject({ title: 'B', notes: 'details', startTime: '09:30' })
      expect(await getTask(task.id)).toEqual(updated)
      const events = await listActivityForTask(task.id)
      expect(events[1]).toMatchObject({
        type: 'task_updated',
        data: { fields: ['title', 'notes', 'startTime'] },
      })
    })

    it('throws RecordNotFoundError for a missing task', async () => {
      await expect(updateTask('missing', { title: 'B' })).rejects.toThrow(RecordNotFoundError)
    })
  })

  describe('setTaskStatus', () => {
    it('AC4.3 saves the status and logs the change with a timestamp', async () => {
      const task = await createTask({ title: 'A', dayKey: DAY, block: 'morning' })
      await setTaskStatus(task.id, 'in_progress')
      await setTaskStatus(task.id, 'done')
      expect((await getTask(task.id))?.status).toBe('done')
      const changes = (await listActivityForTask(task.id)).filter((e) => e.type === 'task_status_changed')
      expect(changes.map((e) => e.data)).toEqual([
        { from: 'todo', to: 'in_progress' },
        { from: 'in_progress', to: 'done' },
      ])
      expect(changes.every((e) => typeof e.at === 'number')).toBe(true)
    })

    it('does not log anything when the status is unchanged', async () => {
      const task = await createTask({ title: 'A', dayKey: DAY, block: 'morning' })
      await setTaskStatus(task.id, 'todo')
      expect(await listActivityForTask(task.id)).toHaveLength(1)
    })
  })

  describe('moveTask', () => {
    it('AC3.1 reorders within a block', async () => {
      await createTask({ title: 'A', dayKey: DAY, block: 'morning' })
      await createTask({ title: 'B', dayKey: DAY, block: 'morning' })
      const c = await createTask({ title: 'C', dayKey: DAY, block: 'morning' })
      await moveTask(c.id, 'morning', 0)
      expect(await titles('morning')).toEqual(['C', 'A', 'B'])
    })

    it('AC3.1 moves across blocks to the given position', async () => {
      const a = await createTask({ title: 'A', dayKey: DAY, block: 'morning' })
      await createTask({ title: 'X', dayKey: DAY, block: 'evening' })
      await createTask({ title: 'Y', dayKey: DAY, block: 'evening' })
      const moved = await moveTask(a.id, 'evening', 1)
      expect(moved.block).toBe('evening')
      expect(await titles('morning')).toEqual([])
      expect(await titles('evening')).toEqual(['X', 'A', 'Y'])
    })

    it('clamps out-of-range positions to the end of the block', async () => {
      const a = await createTask({ title: 'A', dayKey: DAY, block: 'morning' })
      await createTask({ title: 'X', dayKey: DAY, block: 'evening' })
      await moveTask(a.id, 'evening', 99)
      expect(await titles('evening')).toEqual(['X', 'A'])
    })

    it('D2 clears the start time when asked, and logs it', async () => {
      const a = await createTask({ title: 'A', dayKey: DAY, block: 'afternoon', startTime: '14:00' })
      const moved = await moveTask(a.id, 'evening', 0, { clearStartTime: true })
      expect(moved.startTime).toBeNull()
      const events = await listActivityForTask(a.id)
      expect(events.at(-1)).toMatchObject({
        type: 'task_moved',
        data: { fromBlock: 'afternoon', toBlock: 'evening', toIndex: 0, clearedStartTime: true },
      })
    })
  })

  describe('deleteTask', () => {
    it('AC2.3 deletes the task and records the deletion as an outcome', async () => {
      const a = await createTask({ title: 'A', dayKey: DAY, block: 'morning' })
      await db.calendarMappings.put({
        taskId: a.id,
        eventId: 'evt',
        calendarId: 'primary',
        etag: null,
        updatedAt: 1,
        taskUpdatedAt: 1,
        eventUpdatedAt: 1,
      })
      await deleteTask(a.id)
      expect(await getTask(a.id)).toBeUndefined()
      // AC8.4: the link stays as a tombstone so the next calendar sync deletes the event.
      expect(await db.calendarMappings.get(a.id)).toMatchObject({ eventId: 'evt', taskDeleted: true })
      expect((await listActivityForTask(a.id)).at(-1)).toMatchObject({
        type: 'task_deleted',
        data: { title: 'A' },
      })
    })
  })

  describe('restoreTask (PRD FR18)', () => {
    const link = (taskId: string) => ({
      taskId,
      eventId: 'evt',
      calendarId: 'primary',
      etag: null,
      updatedAt: 1,
      taskUpdatedAt: 1,
      eventUpdatedAt: 1,
    })

    it('AC18.2 brings the task back with the same content and position', async () => {
      await createTask({ title: 'First', dayKey: DAY, block: 'afternoon' })
      const a = await createTask({
        title: 'A',
        dayKey: DAY,
        block: 'afternoon',
        notes: 'Notes',
        companyId: 'acme',
        startTime: '14:00',
        durationMinutes: 45,
        jiraIssue: { key: 'ABC-1', title: 'Issue', status: 'To Do' },
      })
      await createTask({ title: 'Last', dayKey: DAY, block: 'afternoon' })
      await setTaskStatus(a.id, 'in_progress')
      const before = await getTask(a.id)

      const restored = await restoreTask(await deleteTask(a.id))

      expect(restored).toEqual({ ...before, updatedAt: restored.updatedAt })
      expect(await titles('afternoon')).toEqual(['First', 'A', 'Last'])
    })

    it('AC18.3 records the restore after the deletion', async () => {
      const a = await createTask({ title: 'A', dayKey: DAY, block: 'morning' })
      await restoreTask(await deleteTask(a.id))
      const types = (await listActivityForTask(a.id)).map((e) => e.type)
      expect(types).toEqual(['task_created', 'task_deleted', 'task_restored'])
    })

    it('restoring twice does nothing the second time', async () => {
      const a = await createTask({ title: 'A', dayKey: DAY, block: 'morning' })
      const deleted = await deleteTask(a.id)
      await restoreTask(deleted)
      await restoreTask(deleted)
      expect(await titles()).toEqual(['A'])
      expect((await listActivityForTask(a.id)).filter((e) => e.type === 'task_restored')).toHaveLength(1)
    })

    it('AC18.4 before the next sync, clears the tombstone so the task keeps its event', async () => {
      const a = await createTask({ title: 'A', dayKey: DAY, block: 'afternoon', startTime: '14:00' })
      await db.calendarMappings.put(link(a.id))
      await restoreTask(await deleteTask(a.id))
      const mapping = await db.calendarMappings.get(a.id)
      expect(mapping).toMatchObject({ eventId: 'evt' })
      expect(mapping?.taskDeleted).toBeUndefined()
    })

    it('AC18.4 after the sync removed the event, a calendar task becomes a Taskuda task so it is pushed again', async () => {
      const a = await createTask({
        title: 'Dentist',
        dayKey: DAY,
        block: 'afternoon',
        startTime: '14:00',
        source: 'calendar',
      })
      await db.calendarMappings.put(link(a.id))
      const deleted = await deleteTask(a.id)
      await db.calendarMappings.delete(a.id) // what the sync does after deleting the event
      expect((await restoreTask(deleted)).source).toBe('manual')
    })
  })

  describe('carryOverTask', () => {
    it('AC11.1 copies the task to the next day in the same block, keeping its status', async () => {
      const a = await createTask({ title: 'A', dayKey: DAY, block: 'afternoon', companyId: 'acme' })
      await setTaskStatus(a.id, 'in_progress')
      const copy = await carryOverTask(a.id, NEXT_DAY)
      expect(copy).toMatchObject({
        title: 'A',
        dayKey: NEXT_DAY,
        block: 'afternoon',
        status: 'in_progress',
        companyId: 'acme',
        carriedOverCount: 1,
        carriedFromTaskId: a.id,
      })
      expect((await getTask(a.id))?.carriedToTaskId).toBe(copy.id)
    })

    it('AC11.2 counts how many times a task has been carried', async () => {
      const a = await createTask({ title: 'A', dayKey: DAY, block: 'morning' })
      const once = await carryOverTask(a.id, NEXT_DAY)
      const twice = await carryOverTask(once.id, '2026-10-21')
      expect(twice.carriedOverCount).toBe(2)
    })

    it('is idempotent: carrying the same task again returns the existing copy', async () => {
      const a = await createTask({ title: 'A', dayKey: DAY, block: 'morning' })
      const first = await carryOverTask(a.id, NEXT_DAY)
      const second = await carryOverTask(a.id, NEXT_DAY)
      expect(second.id).toBe(first.id)
      expect(await listTasksForDay(NEXT_DAY)).toHaveLength(1)
    })

    it('refuses to carry a Done task', async () => {
      const a = await createTask({ title: 'A', dayKey: DAY, block: 'morning' })
      await setTaskStatus(a.id, 'done')
      await expect(carryOverTask(a.id, NEXT_DAY)).rejects.toThrow(ValidationError)
    })

    it('logs the carryover on the original and the creation of the copy', async () => {
      const a = await createTask({ title: 'A', dayKey: DAY, block: 'morning' })
      const copy = await carryOverTask(a.id, NEXT_DAY)
      expect((await listActivityForTask(a.id)).at(-1)).toMatchObject({
        type: 'task_carried_over',
        data: { toDayKey: NEXT_DAY, newTaskId: copy.id },
      })
      expect((await listActivityForTask(copy.id))[0]).toMatchObject({
        type: 'task_created',
        dayKey: NEXT_DAY,
      })
    })
  })
})
