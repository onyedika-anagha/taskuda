import { describe, expect, it } from 'vitest'
import { addDaysToKey, fromDayKey, isPastDay, isValidDayKey, isWorkingDay, toDayKey, todayKey } from './dates'

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

  it('treats Monday to Friday as working days (M2 streak)', () => {
    expect(isWorkingDay('2026-10-16')).toBe(true) // Friday
    expect(isWorkingDay('2026-10-17')).toBe(false) // Saturday
    expect(isWorkingDay('2026-10-18')).toBe(false) // Sunday
    expect(isWorkingDay('2026-10-19')).toBe(true) // Monday
  })
})
