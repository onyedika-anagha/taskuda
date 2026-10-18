import { describe, expect, it } from 'vitest'
import { makeTask } from '@/test/factories'
import type { Closeout } from '@/types/closeout'
import { closeoutStreak, medianMinutesToReport, silentlyDroppedCount } from './metrics'

// 2026-10-21 is a Wednesday.
const TODAY = '2026-10-21'

const closeout = (dayKey: string, minutes: number | null): Closeout => ({
  dayKey,
  startedAt: 0,
  finishedAt: 1,
  reportCopiedAt: minutes === null ? null : minutes * 60_000,
  rating: 4,
  reflection: '',
  outcomes: {},
})

describe('M1 silentlyDroppedCount', () => {
  it('counts unfinished, uncarried tasks from past days in the 4-week window', () => {
    const tasks = [
      makeTask({ id: 'a', dayKey: '2026-10-20', status: 'todo' }), // dropped
      makeTask({ id: 'b', dayKey: '2026-10-20', status: 'in_progress' }), // dropped
      makeTask({ id: 'c', dayKey: '2026-10-20', status: 'done' }),
      makeTask({ id: 'd', dayKey: '2026-10-20', status: 'todo', carriedToTaskId: 'x' }),
      makeTask({ id: 'e', dayKey: TODAY, status: 'todo' }), // today is still open
      makeTask({ id: 'f', dayKey: '2026-09-01', status: 'todo' }), // outside window
    ]
    expect(silentlyDroppedCount(tasks, TODAY)).toBe(2)
  })
})

describe('M2 closeoutStreak', () => {
  it('counts consecutive weekdays, skipping weekends', () => {
    // Fri 16, Mon 19, Tue 20, Wed 21
    expect(closeoutStreak(['2026-10-16', '2026-10-19', '2026-10-20', TODAY], TODAY)).toBe(4)
  })

  it('an open today does not break the streak', () => {
    expect(closeoutStreak(['2026-10-19', '2026-10-20'], TODAY)).toBe(2)
  })

  it('a missed weekday breaks the streak', () => {
    expect(closeoutStreak(['2026-10-16', '2026-10-20', TODAY], TODAY)).toBe(2)
  })

  it('weekend closeouts neither count nor break it', () => {
    expect(closeoutStreak(['2026-10-16', '2026-10-17', '2026-10-19'], '2026-10-19')).toBe(2)
  })

  it('is 0 with no closeouts', () => {
    expect(closeoutStreak([], TODAY)).toBe(0)
  })
})

describe('M3 medianMinutesToReport', () => {
  it('takes the median of copied reports in the window', () => {
    expect(
      medianMinutesToReport(
        [
          closeout('2026-10-19', 4),
          closeout('2026-10-20', 10),
          closeout(TODAY, 2),
          closeout('2026-10-15', null),
        ],
        TODAY,
      ),
    ).toBe(4)
    expect(medianMinutesToReport([closeout('2026-10-19', 4), closeout('2026-10-20', 6)], TODAY)).toBe(5)
  })

  it('is null without any copied report', () => {
    expect(medianMinutesToReport([closeout('2026-10-19', null)], TODAY)).toBeNull()
  })
})
