import { describe, expect, it } from 'vitest'
import { makeTask } from '@/test/factories'
import type { Closeout } from '@/types/closeout'
import { DEFAULT_WORKING_DAYS as MON_FRI } from '@/types/workday'
import type { EyeBreakLogEntry, EyeBreakOutcome } from '@/types/wellbeing'
import {
  closeoutStreak,
  daysWithinBudget,
  eyeBreakFollowThrough,
  medianMinutesToReport,
  sevenDayAverageMs,
  silentlyDroppedCount,
} from './metrics'

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
    expect(closeoutStreak(['2026-10-16', '2026-10-19', '2026-10-20', TODAY], TODAY, MON_FRI)).toBe(4)
  })

  it('an open today does not break the streak', () => {
    expect(closeoutStreak(['2026-10-19', '2026-10-20'], TODAY, MON_FRI)).toBe(2)
  })

  it('a missed weekday breaks the streak', () => {
    expect(closeoutStreak(['2026-10-16', '2026-10-20', TODAY], TODAY, MON_FRI)).toBe(2)
  })

  it('weekend closeouts neither count nor break it', () => {
    expect(closeoutStreak(['2026-10-16', '2026-10-17', '2026-10-19'], '2026-10-19', MON_FRI)).toBe(2)
  })

  it('AC19.2 a missed Saturday breaks the streak when Saturday is a working day', () => {
    const monToSat = [1, 2, 3, 4, 5, 6] as const
    // Fri 16, (Sat 17 missed), Mon 19
    expect(closeoutStreak(['2026-10-16', '2026-10-19'], '2026-10-19', monToSat)).toBe(1)
    expect(closeoutStreak(['2026-10-16', '2026-10-17', '2026-10-19'], '2026-10-19', monToSat)).toBe(3)
  })

  it('AC19.2 days off in a custom week are skipped', () => {
    // Works Tue and Thu only: Thu 15, Tue 20 are consecutive working days.
    expect(closeoutStreak(['2026-10-15', '2026-10-20'], TODAY, [2, 4])).toBe(2)
  })

  it('is 0 with no closeouts', () => {
    expect(closeoutStreak([], TODAY, MON_FRI)).toBe(0)
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

const HOUR = 3_600_000
const entry = (dayKey: string, outcome: EyeBreakOutcome): EyeBreakLogEntry => ({ at: 0, dayKey, outcome })

describe('M4 eyeBreakFollowThrough', () => {
  it('is null with no ended prompts', () => {
    expect(eyeBreakFollowThrough([entry(TODAY, 'snoozed')], TODAY)).toBeNull()
  })

  it('shares Done among prompts that ended in the window; snoozes are not endings', () => {
    const log = [
      entry(TODAY, 'done'),
      entry(TODAY, 'snoozed'),
      entry('2026-10-20', 'done'),
      entry('2026-10-20', 'dismissed'),
      entry('2026-10-19', 'missed'),
      entry('2026-09-01', 'missed'), // outside the window
    ]
    expect(eyeBreakFollowThrough(log, TODAY)).toBe(0.5)
  })
})

describe('M5 daysWithinBudget', () => {
  it('counts past working days with time in Taskuda; today and days off are left out', () => {
    const days = [
      { dayKey: '2026-10-20', ms: 2 * HOUR }, // Tue, exactly on budget: within
      { dayKey: '2026-10-19', ms: 3 * HOUR }, // Mon, over
      { dayKey: '2026-10-18', ms: 5 * HOUR }, // Sun, not a working day
      { dayKey: TODAY, ms: 9 * HOUR }, // still running
      { dayKey: '2026-10-16', ms: 0 },
    ]
    expect(daysWithinBudget(days, TODAY, 2, MON_FRI)).toBe(0.5)
  })

  it('is null before any past working day has time recorded', () => {
    expect(daysWithinBudget([{ dayKey: TODAY, ms: HOUR }], TODAY, 2, MON_FRI)).toBeNull()
  })
})

describe('AC29.4 sevenDayAverageMs', () => {
  it('averages the 7 full days before today, counting days not opened as 0', () => {
    const days = [
      { dayKey: '2026-10-20', ms: 5 * HOUR },
      { dayKey: '2026-10-14', ms: 2 * HOUR },
      { dayKey: '2026-10-13', ms: 9 * HOUR }, // 8 days ago
      { dayKey: TODAY, ms: 9 * HOUR },
    ]
    expect(sevenDayAverageMs(days, TODAY)).toBe(HOUR)
  })
})
