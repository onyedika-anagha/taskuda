import { describe, expect, it } from 'vitest'
import { makeTask } from '@/test/factories'
import { CHEERS, ON_TIME_TOLERANCE_MS, dueReminders, pickCheer, planReminders } from './reminderPlan'

const DAY = '2026-10-19'
const at = (hour: number, minute = 0) => new Date(2026, 9, 19, hour, minute).getTime()
const task = makeTask({ id: 'call', title: 'Client call', dayKey: DAY, startTime: '14:00', createdAt: at(8) })

describe('planReminders (AC9.1, AC9.2)', () => {
  it('plans "Up next" N minutes before and "Starting now" at the start', () => {
    expect(planReminders([task], 5)).toEqual([
      {
        id: `call:${DAY}:14:00:upcoming:5`,
        taskId: 'call',
        kind: 'upcoming',
        at: at(13, 55),
        text: 'Up next at 2:00 PM: Client call.',
      },
      {
        id: `call:${DAY}:14:00:start`,
        taskId: 'call',
        kind: 'start',
        at: at(14),
        text: 'Starting now: Client call.',
      },
    ])
  })

  it('lead time Off keeps only the start alert; done and untimed tasks get none', () => {
    expect(planReminders([task], 0).map((r) => r.kind)).toEqual(['start'])
    expect(planReminders([makeTask({ startTime: null }), { ...task, status: 'done' }], 5)).toEqual([])
  })
})

describe('dueReminders', () => {
  const reminders = planReminders([task], 5)
  const tasks = new Map([[task.id, task]])

  it('a due reminder while the app is visible is on time', () => {
    const due = dueReminders(reminders, tasks, new Set(), at(13, 55) + 1000, true)
    expect(due.onTime.map((r) => r.kind)).toEqual(['upcoming'])
    expect(due.missed).toEqual([])
  })

  it('AC9.5 due while hidden, or too late, is missed instead of spoken', () => {
    expect(dueReminders(reminders, tasks, new Set(), at(13, 56), false).missed).toHaveLength(1)
    const late = dueReminders(reminders, tasks, new Set(), at(13, 55) + ON_TIME_TOLERANCE_MS + 1, true)
    expect(late.onTime).toEqual([])
    expect(late.missed.map((r) => r.kind)).toEqual(['upcoming'])
  })

  it('says only the latest alert per task', () => {
    const due = dueReminders(reminders, tasks, new Set(), at(14) + 1000, true)
    expect(due.onTime.map((r) => r.kind)).toEqual(['start'])
  })

  it('skips handled reminders and those due before the task existed', () => {
    const handled = new Set(reminders.map((r) => r.id))
    expect(dueReminders(reminders, tasks, handled, at(14), true)).toEqual({ onTime: [], missed: [] })
    const lateTask = { ...task, createdAt: at(15) }
    expect(dueReminders(reminders, new Map([[task.id, lateTask]]), new Set(), at(16), true)).toEqual({
      onTime: [],
      missed: [],
    })
  })

  it('picks a cheer from the design copy', () => {
    expect(CHEERS).toContain(pickCheer(0))
    expect(pickCheer(0.999)).toBe(CHEERS[CHEERS.length - 1])
  })
})
