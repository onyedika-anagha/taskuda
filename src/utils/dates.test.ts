import { describe, expect, it } from 'vitest'
import { DEFAULT_WORKING_DAYS } from '@/types/workday'
import {
  addDaysToKey,
  fromDayKey,
  isPastDay,
  isValidDayKey,
  isWorkingDay,
  nextWorkingDay,
  relativeDayName,
  toDayKey,
  todayKey,
} from './dates'

describe('dates', () => {
  it('formats and parses local day keys', () => {
    const date = new Date(2026, 9, 18, 23, 30)
    expect(toDayKey(date)).toBe('2026-10-18')
    expect(toDayKey(fromDayKey('2026-10-18'))).toBe('2026-10-18')
  })

  it('rejects invalid day keys', () => {
    expect(isValidDayKey('2026-02-30')).toBe(false)
    expect(isValidDayKey('18/10/2026')).toBe(false)
    expect(() => fromDayKey('nope')).toThrow('Invalid day key "nope"')
  })

  it('adds days across month and year boundaries', () => {
    expect(addDaysToKey('2026-10-31', 1)).toBe('2026-11-01')
    expect(addDaysToKey('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDaysToKey('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('knows which days are in the past', () => {
    const now = new Date(2026, 9, 18, 10, 0)
    expect(todayKey(now)).toBe('2026-10-18')
    expect(isPastDay('2026-10-17', now)).toBe(true)
    expect(isPastDay('2026-10-18', now)).toBe(false)
    expect(isPastDay('2026-10-19', now)).toBe(false)
  })

  it('AC19.1 treats Monday to Friday as working days by default', () => {
    expect(isWorkingDay('2026-10-16', DEFAULT_WORKING_DAYS)).toBe(true) // Friday
    expect(isWorkingDay('2026-10-17', DEFAULT_WORKING_DAYS)).toBe(false) // Saturday
    expect(isWorkingDay('2026-10-18', DEFAULT_WORKING_DAYS)).toBe(false) // Sunday
    expect(isWorkingDay('2026-10-19', DEFAULT_WORKING_DAYS)).toBe(true) // Monday
  })

  it('AC19.1 follows custom working days', () => {
    expect(isWorkingDay('2026-10-17', [1, 2, 3, 4, 5, 6])).toBe(true) // Saturday
    expect(isWorkingDay('2026-10-16', [2, 4])).toBe(false) // Friday
  })

  it('AC11.1 / AC19.3 nextWorkingDay skips days off', () => {
    expect(nextWorkingDay('2026-10-16', DEFAULT_WORKING_DAYS)).toBe('2026-10-19') // Fri → Mon
    expect(nextWorkingDay('2026-10-19', DEFAULT_WORKING_DAYS)).toBe('2026-10-20') // Mon → Tue
    expect(nextWorkingDay('2026-10-17', DEFAULT_WORKING_DAYS)).toBe('2026-10-19') // Sat → Mon
    expect(nextWorkingDay('2026-10-16', [1, 2, 3, 4, 5, 6])).toBe('2026-10-17') // Fri → Sat
    expect(nextWorkingDay('2026-10-21', [3])).toBe('2026-10-28') // only Wednesdays
    expect(nextWorkingDay('2026-10-21', [])).toBe('2026-10-22')
  })

  it('relativeDayName says tomorrow or the weekday', () => {
    expect(relativeDayName('2026-10-19', '2026-10-20')).toBe('tomorrow')
    expect(relativeDayName('2026-10-16', '2026-10-19')).toBe('Monday')
  })
})
