import { describe, expect, it } from 'vitest'
import { makeTask } from '@/test/factories'
import type { RiskKind } from '@/types/risk'
import type { Task } from '@/types/task'
import { riskLabel, riskSpokenLabel } from './riskLabels'

const TODAY = '2026-10-21'

const CASES: [RiskKind, Partial<Task>, string, string][] = [
  ['overdue', { dueDate: '2026-10-20' }, 'Overdue · due Oct 20', 'overdue, due October 20'],
  ['overdue', { dueDate: TODAY, dueTime: '17:00' }, 'Overdue · due 5:00 PM', 'overdue, due 5:00 PM'],
  ['overran', { startTime: '14:00' }, 'Overran · ended 2:30 PM', 'overran, ended 2:30 PM'],
  [
    'overran',
    { startTime: '23:30', durationMinutes: 60 },
    'Overran · ended 12:30 AM',
    'overran, ended 12:30 AM',
  ],
  [
    'running_late',
    { startTime: '10:00' },
    'Running late · 10:00 AM',
    'running late, was due to start at 10:00 AM',
  ],
  ['due_today', { dueDate: TODAY }, 'Due today', 'due today'],
  ['due_today', { dueDate: TODAY, dueTime: '17:00' }, 'Due today 5:00 PM', 'due today at 5:00 PM'],
  ['stuck', { carriedOverCount: 4 }, 'Stuck · carried over ×4', 'stuck, carried over 4 times'],
]

describe('riskLabels (design Section 8)', () => {
  it.each(CASES)('%s %o', (kind, overrides, visible, spoken) => {
    const task = makeTask(overrides)
    expect(riskLabel(kind, task, TODAY)).toBe(visible)
    expect(riskSpokenLabel(kind, task, TODAY)).toBe(spoken)
  })
})
