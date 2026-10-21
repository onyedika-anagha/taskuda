import { describe, expect, it } from 'vitest'
import { makeTask } from '@/test/factories'
import { RISK_KINDS, type RiskKind } from '@/types/risk'
import type { Task, TaskStatus } from '@/types/task'
import { atRiskTasks, taskRisk } from './taskRisk'

const TODAY = '2026-10-21'

function at(time: string, day = TODAY): number {
  const [y, m, d] = day.split('-').map(Number)
  const [h, min] = time.split(':').map(Number)
  return new Date(y, m - 1, d, h, min).getTime()
}

const task = (overrides: Partial<Task>) => makeTask({ dayKey: TODAY, ...overrides })

describe('taskRisk (PRD AC31.1–AC31.3)', () => {
  it('Overdue once the due moment has passed, on any day the task is planned for', () => {
    expect(taskRisk(task({ dueDate: '2026-10-20' }), at('09:00'))).toBe('overdue')
    expect(taskRisk(task({ dayKey: '2026-10-23', dueDate: '2026-10-20' }), at('09:00'))).toBe('overdue')
    expect(taskRisk(task({ dueDate: TODAY, dueTime: '17:00' }), at('17:00'))).toBe('due_today')
    expect(taskRisk(task({ dueDate: TODAY, dueTime: '17:00' }), at('17:01'))).toBe('overdue')
  })

  it('a due date with no time is not overdue until the day is over', () => {
    expect(taskRisk(task({ dueDate: TODAY }), at('23:59'))).toBe('due_today')
  })

  it('Running late from 10 minutes after the start, only while To Do', () => {
    const t = task({ startTime: '10:00', durationMinutes: 60 })
    expect(taskRisk(t, at('10:09'))).toBeNull()
    expect(taskRisk(t, at('10:10'))).toBe('running_late')
    expect(taskRisk({ ...t, status: 'in_progress' }, at('10:30'))).toBeNull()
  })

  it('Overran once start + duration has passed (30 minutes with no duration), even in progress', () => {
    expect(taskRisk(task({ startTime: '10:00' }), at('10:30'))).toBe('overran')
    expect(taskRisk(task({ startTime: '10:00', status: 'in_progress' }), at('10:29'))).toBeNull()
    expect(taskRisk(task({ startTime: '10:00', status: 'in_progress' }), at('10:30'))).toBe('overran')
  })

  it('timing only counts on today; future days show due and carryover states only', () => {
    expect(taskRisk(task({ dayKey: '2026-10-22', startTime: '01:00' }), at('23:00'))).toBeNull()
    expect(taskRisk(task({ dayKey: '2026-10-22', carriedOverCount: 3 }), at('09:00'))).toBe('stuck')
  })

  it('Stuck at 3 carryovers or more', () => {
    expect(taskRisk(task({ carriedOverCount: 2 }), at('09:00'))).toBeNull()
    expect(taskRisk(task({ carriedOverCount: 3 }), at('09:00'))).toBe('stuck')
  })

  it('AC31.3 Done tasks and past days never show a marker', () => {
    expect(taskRisk(task({ status: 'done', dueDate: '2026-10-01' }), at('09:00'))).toBeNull()
    expect(taskRisk(task({ dayKey: '2026-10-20', dueDate: '2026-10-01' }), at('09:00'))).toBeNull()
  })

  it('RK19 at midnight, yesterday’s late task stops showing and today’s due date starts', () => {
    const lateEvening = task({ dayKey: '2026-10-20', startTime: '23:30', durationMinutes: 60 })
    expect(taskRisk(lateEvening, at('23:59', '2026-10-20'))).toBe('running_late')
    expect(taskRisk(lateEvening, at('00:10'))).toBeNull()
    expect(taskRisk(task({ dueDate: TODAY }), at('00:00'))).toBe('due_today')
  })

  it('RK19 an evening task after midnight is on its own day, like reminders', () => {
    expect(taskRisk(task({ startTime: '01:00' }), at('01:15'))).toBe('running_late')
  })

  describe('DAC24 / AC31.2: one marker, in priority order, for every combination', () => {
    const dues: Record<string, Partial<Task>> = {
      none: {},
      past: { dueDate: '2026-10-20' },
      laterToday: { dueDate: TODAY, dueTime: '18:00' },
      future: { dueDate: '2026-10-25' },
    }
    const starts: Record<string, Partial<Task>> = {
      none: {},
      ended: { startTime: '09:00' },
      late: { startTime: '11:40', durationMinutes: 60 },
      justStarted: { startTime: '11:55' },
      later: { startTime: '15:00' },
    }
    const statuses: TaskStatus[] = ['todo', 'in_progress', 'done']
    const now = at('12:00')

    for (const [dueName, due] of Object.entries(dues)) {
      for (const [startName, start] of Object.entries(starts)) {
        for (const status of statuses) {
          for (const carriedOverCount of [0, 3]) {
            // Worked out from the AC31.1 wording, independently of `taskRisk`.
            const applies = new Set<RiskKind>()
            if (status !== 'done') {
              if (dueName === 'past') applies.add('overdue')
              if (dueName === 'laterToday') applies.add('due_today')
              if (startName === 'ended') applies.add('overran')
              if ((startName === 'ended' || startName === 'late') && status === 'todo') {
                applies.add('running_late')
              }
              if (carriedOverCount >= 3) applies.add('stuck')
            }
            const expected = RISK_KINDS.find((kind) => applies.has(kind)) ?? null

            it(`due ${dueName}, start ${startName}, ${status}, carried ${carriedOverCount} → ${expected}`, () => {
              expect(taskRisk(task({ ...due, ...start, status, carriedOverCount }), now)).toBe(expected)
            })
          }
        }
      }
    }
  })
})

describe('atRiskTasks (PRD AC32.3)', () => {
  it('sorts by priority, then start time, untimed last', () => {
    const tasks = [
      task({ id: 'stuck', carriedOverCount: 4, order: 1 }),
      task({ id: 'ended', startTime: '10:00', order: 2 }),
      task({ id: 'due', dueDate: TODAY, order: 3 }),
      task({ id: 'late', startTime: '10:20', durationMinutes: 120, order: 4 }),
      task({ id: 'fine', order: 5 }),
      task({ id: 'overdue', dueDate: '2026-10-19', order: 6 }),
    ]
    expect(atRiskTasks(tasks, at('10:45')).map((r) => [r.task.id, r.kind])).toEqual([
      ['overdue', 'overdue'],
      ['ended', 'overran'],
      ['late', 'running_late'],
      ['due', 'due_today'],
      ['stuck', 'stuck'],
    ])
  })
})
