import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { listMappings } from '@/services/db/calendarMappingRepository'
import { db } from '@/services/db/database'
import {
  carryOverTask,
  createTask,
  deleteTask,
  getTask,
  listTasksForDay,
  updateTask,
} from '@/services/db/taskRepository'
import { forgetAccessToken } from '@/services/google/googleAuth'
import { installFakeCalendar } from '@/test/fakeCalendar'
import { installFakeGis, removeFakeGis } from '@/test/fakeGoogle'
import { resetDatabase } from '@/test/resetDatabase'
import { addDaysToKey, todayKey } from '@/utils/dates'
import { getCalendarSettings, setCalendarEnabled, setSyncCalendar } from './calendarSettings'
import { runCalendarSync } from './calendarSync'

const today = todayKey()
const tomorrow = addDaysToKey(today, 1)

function at(dayKey: string, hour: number, minute = 0): string {
  const [y, m, d] = dayKey.split('-').map(Number)
  return new Date(y, m - 1, d, hour, minute).toISOString()
}

/** Makes the next local edit clearly later than anything the fake calendar stamped. */
async function later(): Promise<void> {
  vi.setSystemTime(Date.now() + 60_000)
}

describe('calendarSync (PRD FR8)', () => {
  let calendar: ReturnType<typeof installFakeCalendar>

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    forgetAccessToken()
    await resetDatabase()
    installFakeGis()
    calendar = installFakeCalendar()
    await setSyncCalendar('primary-id', 'Me')
    await setCalendarEnabled(true)
  })
  afterEach(() => {
    removeFakeGis()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('does nothing while sync is off', async () => {
    await setCalendarEnabled(false)
    await createTask({ title: 'Call', dayKey: today, block: 'afternoon', startTime: '14:00' })
    await runCalendarSync()
    expect(calendar.requests).toHaveLength(0)
  })

  it('AC8.1 a task with a start time becomes an event; untimed tasks don’t', async () => {
    const task = await createTask({
      title: 'Client call',
      dayKey: today,
      block: 'afternoon',
      startTime: '14:00',
    })
    await createTask({ title: 'No time', dayKey: today, block: 'morning' })
    await runCalendarSync()
    expect(calendar.live()).toHaveLength(1)
    expect(calendar.live()[0]).toMatchObject({
      summary: 'Client call',
      extendedProperties: { private: { taskudaTaskId: task.id } },
    })
    expect(calendar.requests[0].headers.authorization).toBe('Bearer fake-token')
  })

  it('AC8.2 / AC8.5 edits update the same event; repeated syncs create no duplicates', async () => {
    const task = await createTask({ title: 'Call', dayKey: today, block: 'afternoon', startTime: '14:00' })
    await runCalendarSync()
    await runCalendarSync()
    await later()
    await updateTask(task.id, { title: 'Client call', startTime: '15:30' })
    await runCalendarSync()
    await runCalendarSync()

    expect(calendar.live()).toHaveLength(1)
    expect(calendar.live()[0].summary).toBe('Client call')
    expect(calendar.live()[0].start?.dateTime).toBe(`${today}T15:30:00`)
    expect(await listTasksForDay(today)).toHaveLength(1)
  })

  it('AC8.3 a new calendar event becomes a task on the right day and block', async () => {
    calendar.addRemote({
      summary: 'Dentist',
      start: { dateTime: at(tomorrow, 18, 30) },
      end: { dateTime: at(tomorrow, 19, 15) },
    })
    await runCalendarSync()
    expect(await listTasksForDay(tomorrow)).toMatchObject([
      { title: 'Dentist', block: 'evening', startTime: '18:30', durationMinutes: 45, source: 'calendar' },
    ])
    await runCalendarSync()
    expect(await listTasksForDay(tomorrow)).toHaveLength(1)
    expect(calendar.live()).toHaveLength(1) // not pushed back as a second event
  })

  it('skips all-day events', async () => {
    calendar.addRemote({ summary: 'Holiday', start: { date: tomorrow }, end: { date: tomorrow } })
    await runCalendarSync()
    expect(await listTasksForDay(tomorrow)).toEqual([])
  })

  it('pulls edits made in the calendar onto the task', async () => {
    const remote = calendar.addRemote({
      summary: 'Dentist',
      start: { dateTime: at(today, 9) },
      end: { dateTime: at(today, 9, 30) },
    })
    await runCalendarSync()
    calendar.editRemote(remote.id, {
      summary: 'Dentist (moved)',
      start: { dateTime: at(tomorrow, 13) },
      end: { dateTime: at(tomorrow, 14) },
    })
    await runCalendarSync()
    expect(await listTasksForDay(today)).toEqual([])
    expect(await listTasksForDay(tomorrow)).toMatchObject([
      { title: 'Dentist (moved)', block: 'afternoon', startTime: '13:00', durationMinutes: 60 },
    ])
  })

  it('AC8.4 deleting the task deletes the event', async () => {
    const task = await createTask({ title: 'Call', dayKey: today, block: 'afternoon', startTime: '14:00' })
    await runCalendarSync()
    await deleteTask(task.id)
    await runCalendarSync()
    expect(calendar.live()).toEqual([])
    expect(await listMappings()).toEqual([])
  })

  it('AC8.4 deleting the event deletes the task', async () => {
    const task = await createTask({ title: 'Call', dayKey: today, block: 'afternoon', startTime: '14:00' })
    await runCalendarSync()
    calendar.deleteRemote(calendar.live()[0].id)
    await runCalendarSync()
    expect(await getTask(task.id)).toBeUndefined()
    expect(await listMappings()).toEqual([])
  })

  it('removing the start time removes the event but keeps the task', async () => {
    const task = await createTask({ title: 'Call', dayKey: today, block: 'afternoon', startTime: '14:00' })
    await runCalendarSync()
    await later()
    await updateTask(task.id, { startTime: null })
    await runCalendarSync()
    expect(calendar.live()).toEqual([])
    expect(await getTask(task.id)).toBeDefined()
  })

  describe('RK6 conflicts: the later edit wins', () => {
    it('the calendar edit is newer → it wins', async () => {
      const task = await createTask({ title: 'Call', dayKey: today, block: 'afternoon', startTime: '14:00' })
      await runCalendarSync()
      await updateTask(task.id, { title: 'Local title' })
      await later()
      calendar.editRemote(calendar.live()[0].id, { summary: 'Remote title' })
      await runCalendarSync()
      expect((await getTask(task.id))?.title).toBe('Remote title')
      expect(calendar.live()[0].summary).toBe('Remote title')
    })

    it('the task edit is newer → it wins', async () => {
      const task = await createTask({ title: 'Call', dayKey: today, block: 'afternoon', startTime: '14:00' })
      await runCalendarSync()
      calendar.editRemote(calendar.live()[0].id, { summary: 'Remote title' })
      await later()
      await updateTask(task.id, { title: 'Local title' })
      await runCalendarSync()
      expect((await getTask(task.id))?.title).toBe('Local title')
      expect(calendar.live()[0].summary).toBe('Local title')
    })

    it('a task edited after its event was deleted is kept and gets a new event', async () => {
      const task = await createTask({ title: 'Call', dayKey: today, block: 'afternoon', startTime: '14:00' })
      await runCalendarSync()
      calendar.deleteRemote(calendar.live()[0].id)
      await later()
      await updateTask(task.id, { title: 'Still needed' })
      await runCalendarSync()
      expect((await getTask(task.id))?.title).toBe('Still needed')
      expect(calendar.live()).toHaveLength(1)
      expect(calendar.live()[0].summary).toBe('Still needed')
    })
  })

  it('an expired sync token (410) triggers a full sync without duplicates', async () => {
    await createTask({ title: 'Call', dayKey: today, block: 'afternoon', startTime: '14:00' })
    calendar.addRemote({
      summary: 'Dentist',
      start: { dateTime: at(today, 9) },
      end: { dateTime: at(today, 10) },
    })
    await runCalendarSync()
    calendar.state.expireTokens = true
    await runCalendarSync()
    expect(calendar.live()).toHaveLength(2)
    expect(await listTasksForDay(today)).toHaveLength(2)
    expect((await getCalendarSettings()).syncToken).toMatch(/^s\d+$/)
  })

  it('re-links its own events if the link was lost (e.g. after a restore)', async () => {
    await createTask({ title: 'Call', dayKey: today, block: 'afternoon', startTime: '14:00' })
    await runCalendarSync()
    await db.calendarMappings.clear()
    await db.settings.delete('google.calendar.syncToken')
    await runCalendarSync()
    expect(calendar.live()).toHaveLength(1)
    expect(await listTasksForDay(today)).toHaveLength(1)
  })

  it('a carried-over copy gets its own event on the next day', async () => {
    const task = await createTask({ title: 'Call', dayKey: today, block: 'afternoon', startTime: '14:00' })
    await runCalendarSync()
    await carryOverTask(task.id, tomorrow)
    await runCalendarSync()
    expect(
      calendar
        .live()
        .map((e) => e.start?.dateTime)
        .sort(),
    ).toEqual([`${today}T14:00:00`, `${tomorrow}T14:00:00`])
  })
})
