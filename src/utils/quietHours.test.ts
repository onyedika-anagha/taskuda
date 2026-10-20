import { describe, expect, it } from 'vitest'
import { isInQuietHours, isInTimeRange, isOvernight } from './quietHours'

const at = (h: number, m = 0) => new Date(2026, 9, 20, h, m)

describe('quiet hours (PRD FR23)', () => {
  it('a daytime range includes its start and excludes its end', () => {
    const range = { start: '12:00', end: '13:00' }
    expect(isInTimeRange(at(11, 59), range)).toBe(false)
    expect(isInTimeRange(at(12, 0), range)).toBe(true)
    expect(isInTimeRange(at(12, 59), range)).toBe(true)
    expect(isInTimeRange(at(13, 0), range)).toBe(false)
  })

  it('AC23.1 a range can cross midnight', () => {
    const range = { start: '22:00', end: '07:00' }
    expect(isOvernight(range)).toBe(true)
    expect(isInTimeRange(at(21, 59), range)).toBe(false)
    expect(isInTimeRange(at(23, 30), range)).toBe(true)
    expect(isInTimeRange(at(3, 0), range)).toBe(true)
    expect(isInTimeRange(at(7, 0), range)).toBe(false)
  })

  it('only counts when quiet hours are on', () => {
    expect(isInQuietHours(at(23), { enabled: false, start: '22:00', end: '07:00' })).toBe(false)
    expect(isInQuietHours(at(23), { enabled: true, start: '22:00', end: '07:00' })).toBe(true)
  })

  it('an empty range (start = end) is never inside', () => {
    expect(isInTimeRange(at(9), { start: '09:00', end: '09:00' })).toBe(false)
  })
})
