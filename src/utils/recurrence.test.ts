import { describe, expect, it } from 'vitest'
import type { RecurringSeries, RepeatPattern } from '@/types/recurring'
import { DEFAULT_WORKING_DAYS as MON_FRI } from '@/types/workday'
import { matchesDay, seriesFallsOn } from './recurrence'

describe('matchesDay (PRD AC20.1)', () => {
  const cases: [string, RepeatPattern, string, boolean][] = [
    ['every day', { kind: 'daily' }, '2026-10-24', true],
    ['working days: Friday', { kind: 'working_days' }, '2026-10-23', true],
    ['working days: Saturday', { kind: 'working_days' }, '2026-10-24', false],
    ['weekly Tue/Thu on a Thursday', { kind: 'weekly', weekdays: [2, 4] }, '2026-10-22', true],
    ['weekly Tue/Thu on a Wednesday', { kind: 'weekly', weekdays: [2, 4] }, '2026-10-21', false],
    ['monthly on the 15th', { kind: 'monthly', dayOfMonth: 15 }, '2026-11-15', true],
    ['monthly on the 15th, the 16th', { kind: 'monthly', dayOfMonth: 15 }, '2026-11-16', false],
    ['monthly 31st in a 31-day month', { kind: 'monthly', dayOfMonth: 31 }, '2026-10-31', true],
    ['monthly 31st moves to Nov 30', { kind: 'monthly', dayOfMonth: 31 }, '2026-11-30', true],
    ['monthly 31st, not Nov 29', { kind: 'monthly', dayOfMonth: 31 }, '2026-11-29', false],
    ['monthly 30th moves to Feb 28', { kind: 'monthly', dayOfMonth: 30 }, '2027-02-28', true],
    ['monthly 29th in a leap year: Feb 29', { kind: 'monthly', dayOfMonth: 29 }, '2028-02-29', true],
    ['monthly 29th in a leap year, not Feb 28', { kind: 'monthly', dayOfMonth: 29 }, '2028-02-28', false],
    ['monthly 29th in a common year: Feb 28', { kind: 'monthly', dayOfMonth: 29 }, '2027-02-28', true],
  ]

  it.each(cases)('%s', (_name, pattern, dayKey, expected) => {
    expect(matchesDay(pattern, dayKey, MON_FRI)).toBe(expected)
  })

  it('working days follow the user’s setting (AC19.4)', () => {
    expect(matchesDay({ kind: 'working_days' }, '2026-10-24', [1, 2, 3, 4, 5, 6])).toBe(true)
  })
})

describe('seriesFallsOn', () => {
  const series: RecurringSeries = {
    id: 's',
    title: 'Standup',
    notes: '',
    companyId: null,
    block: 'morning',
    startTime: null,
    durationMinutes: null,
    jiraIssue: null,
    pattern: { kind: 'daily' },
    startDayKey: '2026-10-21',
    endedFromDayKey: '2026-10-30',
    skippedDayKeys: ['2026-10-23'],
    createdAt: 1,
    updatedAt: 1,
  }

  it('runs from the start day up to the day it ended, without skipped days', () => {
    expect(seriesFallsOn(series, '2026-10-20', MON_FRI)).toBe(false)
    expect(seriesFallsOn(series, '2026-10-21', MON_FRI)).toBe(true)
    expect(seriesFallsOn(series, '2026-10-23', MON_FRI)).toBe(false)
    expect(seriesFallsOn(series, '2026-10-29', MON_FRI)).toBe(true)
    expect(seriesFallsOn(series, '2026-10-30', MON_FRI)).toBe(false)
  })
})
