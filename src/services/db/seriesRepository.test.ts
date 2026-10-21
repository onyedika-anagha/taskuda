import { beforeEach, describe, expect, it } from 'vitest'
import { setWorkingDays } from '@/services/workday/workdaySettings'
import { resetDatabase } from '@/test/resetDatabase'
import { db } from './database'
import {
  changeSeriesFrom,
  deleteOccurrence,
  ensureOccurrences,
  getSeries,
  restoreOccurrences,
  startSeries,
} from './seriesRepository'
import { carryOverTask, createTask, listTasksForDay, setTaskStatus } from './taskRepository'

// Wednesday 2026-10-21 is "today" in these tests.
const TODAY = '2026-10-21'
const TOMORROW = '2026-10-22'
const IN_TWO_DAYS = '2026-10-23'

async function dailyStandup(dayKey = TODAY) {
  const task = await createTask({ title: 'Standup', dayKey, block: 'morning', startTime: '09:30' })
  const series = await startSeries(task.id, { kind: 'daily' })
  return { task: (await db.tasks.get(task.id))!, series }
}

const titlesOn = async (dayKey: string) => (await listTasksForDay(dayKey)).map((t) => t.title)

describe('series and occurrences (PRD FR20)', () => {
  beforeEach(async () => {
    await resetDatabase()
    await setWorkingDays([1, 2, 3, 4, 5])
  })

  it('starting a series links the task and copies its fields', async () => {
    const { task, series } = await dailyStandup()
    expect(task.seriesId).toBe(series.id)
    expect(series).toMatchObject({
      title: 'Standup',
      block: 'morning',
      startTime: '09:30',
      startDayKey: TODAY,
    })
  })

  it('AC20.2 adds an occurrence when a matching future day is shown, as a normal task', async () => {
    const { series } = await dailyStandup()
    expect(await ensureOccurrences(TOMORROW, TODAY)).toBe(1)
    const [occurrence] = await listTasksForDay(TOMORROW)
    expect(occurrence).toMatchObject({
      title: 'Standup',
      startTime: '09:30',
      status: 'todo',
      seriesId: series.id,
    })
  })

  it('AC20.3 never adds occurrences on past days', async () => {
    await dailyStandup('2026-10-19')
    expect(await ensureOccurrences('2026-10-20', TODAY)).toBe(0)
    expect(await titlesOn('2026-10-20')).toEqual([])
  })

  it('is safe to run twice, also at the same time', async () => {
    await dailyStandup()
    await Promise.all([ensureOccurrences(TOMORROW, TODAY), ensureOccurrences(TOMORROW, TODAY)])
    await ensureOccurrences(TOMORROW, TODAY)
    expect(await titlesOn(TOMORROW)).toEqual(['Standup'])
  })

  it('skips days the pattern doesn’t match (working days only on a Saturday)', async () => {
    const task = await createTask({ title: 'Report', dayKey: TODAY, block: 'afternoon' })
    await startSeries(task.id, { kind: 'working_days' })
    expect(await ensureOccurrences('2026-10-24', TODAY)).toBe(0)
    expect(await ensureOccurrences('2026-10-26', TODAY)).toBe(1)
  })

  it('AC20.4 a carried copy keeps the series, and the day gets no second occurrence', async () => {
    const { task, series } = await dailyStandup()
    const copy = await carryOverTask(task.id, TOMORROW)
    expect(copy.seriesId).toBe(series.id)
    expect(await ensureOccurrences(TOMORROW, TODAY)).toBe(0)
    expect(await titlesOn(TOMORROW)).toEqual(['Standup'])
  })

  it('AC20.4 carrying onto a day that already has its occurrence links to it instead of copying', async () => {
    const { task } = await dailyStandup()
    await setTaskStatus(task.id, 'in_progress')
    await ensureOccurrences(TOMORROW, TODAY)
    const carried = await carryOverTask(task.id, TOMORROW)
    const tomorrow = await listTasksForDay(TOMORROW)
    expect(tomorrow).toHaveLength(1)
    expect(tomorrow[0]).toMatchObject({ id: carried.id, carriedOverCount: 1, carriedFromTaskId: task.id })
    expect((await db.tasks.get(task.id))?.carriedToTaskId).toBe(carried.id)
  })

  describe('AC20.5 edit scopes', () => {
    it('"This task only" changes only that task, and its day keeps it as the occurrence', async () => {
      const { task } = await dailyStandup()
      await ensureOccurrences(TOMORROW, TODAY)
      const [tomorrow] = await listTasksForDay(TOMORROW)
      await db.tasks.update(tomorrow.id, { title: 'Longer standup', updatedAt: Date.now() + 1 })
      await ensureOccurrences(TOMORROW, TODAY)
      expect(await titlesOn(TOMORROW)).toEqual(['Longer standup'])
      expect(await titlesOn(TODAY)).toEqual([task.title])
    })

    it('"This and future tasks" changes this task and later untouched ones, never past days', async () => {
      const { task: monday } = await dailyStandup('2026-10-19')
      await ensureOccurrences(TODAY, TODAY)
      await ensureOccurrences(TOMORROW, TODAY)
      await ensureOccurrences(IN_TWO_DAYS, TODAY)
      const [today] = await listTasksForDay(TODAY)
      const [inTwo] = await listTasksForDay(IN_TWO_DAYS)
      await setTaskStatus(inTwo.id, 'in_progress') // touched: keeps its own state

      await changeSeriesFrom(today, { title: 'Team sync' }, 'morning', { kind: 'daily' })
      await ensureOccurrences(TOMORROW, TODAY)

      expect(await titlesOn('2026-10-19')).toEqual(['Standup'])
      expect(await titlesOn(TODAY)).toEqual(['Team sync'])
      expect(await titlesOn(TOMORROW)).toEqual(['Team sync'])
      const kept = (await listTasksForDay(IN_TWO_DAYS))[0]
      expect(kept).toMatchObject({ title: 'Standup', status: 'in_progress' })
      const newSeriesId = (await db.tasks.get(today.id))?.seriesId
      expect(kept.seriesId).toBe(newSeriesId)
      expect((await getSeries(monday.seriesId!))?.endedFromDayKey).toBe(TODAY)
      // The kept task stands in for the new series on its day.
      expect(await ensureOccurrences(IN_TWO_DAYS, TODAY)).toBe(0)
    })

    it('"This and future tasks" with Doesn’t repeat stops the series', async () => {
      const { task } = await dailyStandup()
      await changeSeriesFrom(task, {}, 'morning', null)
      expect((await db.tasks.get(task.id))?.seriesId).toBeNull()
      expect(await ensureOccurrences(TOMORROW, TODAY)).toBe(0)
    })
  })

  describe('AC20.5 delete scopes and Undo (FR18)', () => {
    it('"This task only" deletes it and the day doesn’t get it back', async () => {
      const { series } = await dailyStandup()
      await ensureOccurrences(TOMORROW, TODAY)
      const [tomorrow] = await listTasksForDay(TOMORROW)
      await deleteOccurrence(tomorrow, 'this')
      expect(await ensureOccurrences(TOMORROW, TODAY)).toBe(0)
      expect(await ensureOccurrences(IN_TWO_DAYS, TODAY)).toBe(1)
      expect((await getSeries(series.id))?.skippedDayKeys).toEqual([TOMORROW])
    })

    it('"This and future tasks" stops the series and deletes later tasks; Undo brings both back', async () => {
      const { task, series } = await dailyStandup()
      await ensureOccurrences(TOMORROW, TODAY)
      const deleted = await deleteOccurrence(task, 'future')
      expect(await titlesOn(TODAY)).toEqual([])
      expect(await titlesOn(TOMORROW)).toEqual([])
      expect(await ensureOccurrences(IN_TWO_DAYS, TODAY)).toBe(0)

      await restoreOccurrences(deleted)
      expect(await titlesOn(TODAY)).toEqual(['Standup'])
      expect(await titlesOn(TOMORROW)).toEqual(['Standup'])
      expect((await getSeries(series.id))?.endedFromDayKey).toBeNull()
      expect(await ensureOccurrences(IN_TWO_DAYS, TODAY)).toBe(1)
    })
  })
})
