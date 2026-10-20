import { describe, expect, it } from 'vitest'
import { makeTask } from '@/test/factories'
import type { Task } from '@/types/task'
import { carryoverInsights } from './carryoverInsights'

const TODAY = '2026-10-21'
const YESTERDAY = '2026-10-20'

let seq = 0
function tasks(count: number, overrides: Partial<Task>): Task[] {
  return Array.from({ length: count }, () => makeTask({ id: `t${seq++}`, dayKey: YESTERDAY, ...overrides }))
}

describe('carryoverInsights (PRD FR26)', () => {
  it('AC26.4 has no overall rate without past tasks in the window', () => {
    const result = carryoverInsights(
      [...tasks(2, { dayKey: TODAY }), ...tasks(1, { dayKey: '2026-09-01' })],
      TODAY,
    )
    expect(result.overall).toBeNull()
    expect(result.byCompany).toEqual([])
  })

  it('AC26.1 rates each company and overall from past days in the 4-week window only', () => {
    const result = carryoverInsights(
      [
        ...tasks(2, { companyId: 'acme', carriedToTaskId: 'x' }),
        ...tasks(3, { companyId: 'acme' }),
        ...tasks(1, { companyId: null, carriedToTaskId: 'y' }),
        ...tasks(4, { companyId: 'acme', dayKey: TODAY, carriedToTaskId: 'z' }), // today: not past
        ...tasks(4, { companyId: 'acme', dayKey: '2026-09-01', carriedToTaskId: 'z' }), // outside window
      ],
      TODAY,
    )
    expect(result.overall).toMatchObject({ total: 6, carried: 3, rate: 0.5 })
    expect(result.byCompany).toEqual([
      { companyId: null, total: 1, carried: 1, rate: 1 },
      { companyId: 'acme', total: 5, carried: 2, rate: 0.4 },
    ])
  })

  it('AC26.2 flags companies with at least 5 tasks and a rate of 30% or more', () => {
    const result = carryoverInsights(
      [
        ...tasks(3, { companyId: 'acme', carriedToTaskId: 'x' }),
        ...tasks(7, { companyId: 'acme' }), // 10 tasks, 30% → flagged
        ...tasks(4, { companyId: 'small', carriedToTaskId: 'x' }), // 100% but only 4 tasks
        ...tasks(1, { companyId: 'calm', carriedToTaskId: 'x' }),
        ...tasks(4, { companyId: 'calm' }), // 5 tasks, 20%
        ...tasks(6, { companyId: null, carriedToTaskId: 'x' }), // no company to name
      ],
      TODAY,
    )
    expect(result.needsAttention.map((r) => r.companyId)).toEqual(['acme'])
  })

  it('AC26.3 lists open tasks carried 3 times or more, most carried first', () => {
    const result = carryoverInsights(
      [
        makeTask({ id: 'three', dayKey: TODAY, carriedOverCount: 3 }),
        makeTask({ id: 'five', dayKey: TODAY, carriedOverCount: 5, status: 'in_progress' }),
        makeTask({ id: 'two', dayKey: TODAY, carriedOverCount: 2 }),
        makeTask({ id: 'done', dayKey: TODAY, carriedOverCount: 4, status: 'done' }),
        // An earlier copy that was carried on: only its latest copy counts.
        makeTask({ id: 'old', dayKey: YESTERDAY, carriedOverCount: 4, carriedToTaskId: 'five' }),
      ],
      TODAY,
    )
    expect(result.repeatedlyCarried.map((t) => t.id)).toEqual(['five', 'three'])
  })
})
