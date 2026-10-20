import { describe, expect, it } from 'vitest'
import {
  blockForDate,
  blockForTime,
  blockTimeLeft,
  isTimeInBlock,
  isValidTime,
  timeToMinutes,
} from './timeBlocks'

describe('timeBlocks', () => {
  it.each([
    ['05:00', 'morning'],
    ['11:59', 'morning'],
    ['12:00', 'afternoon'],
    ['16:59', 'afternoon'],
    ['17:00', 'evening'],
    ['23:59', 'evening'],
    ['00:00', 'evening'],
    ['04:59', 'evening'],
  ])('puts %s in the %s block', (time, block) => {
    expect(blockForTime(time)).toBe(block)
  })

  it('derives the block from a date (default block for new tasks, design F2)', () => {
    expect(blockForDate(new Date(2026, 9, 18, 9, 30))).toBe('morning')
    expect(blockForDate(new Date(2026, 9, 18, 14, 0))).toBe('afternoon')
    expect(blockForDate(new Date(2026, 9, 18, 2, 0))).toBe('evening')
  })

  it('validates HH:mm times', () => {
    expect(isValidTime('09:05')).toBe(true)
    expect(isValidTime('9:05')).toBe(false)
    expect(isValidTime('24:00')).toBe(false)
    expect(isValidTime('12:60')).toBe(false)
    expect(() => timeToMinutes('nope')).toThrow('Invalid time "nope", expected HH:mm')
  })

  it('checks whether a time belongs to a block (design D2)', () => {
    expect(isTimeInBlock('14:00', 'afternoon')).toBe(true)
    expect(isTimeInBlock('14:00', 'evening')).toBe(false)
  })
})

describe('blockTimeLeft (PRD FR27)', () => {
  const at = (h: number, m: number, s = 0) => new Date(2026, 9, 20, h, m, s)

  it('AC27.1 counts down to the end of Morning and Afternoon', () => {
    expect(blockTimeLeft(at(10, 40))).toEqual({ block: 'morning', minutesLeft: 80 })
    expect(blockTimeLeft(at(16, 15))).toEqual({ block: 'afternoon', minutesLeft: 45 })
  })

  it('rounds up, so the last seconds still read 1 min', () => {
    expect(blockTimeLeft(at(11, 59, 30))).toEqual({ block: 'morning', minutesLeft: 1 })
    expect(blockTimeLeft(at(11, 58, 1))).toEqual({ block: 'morning', minutesLeft: 2 })
  })

  it('AC27.2 moves to the next block when one ends', () => {
    expect(blockTimeLeft(at(12, 0))).toEqual({ block: 'afternoon', minutesLeft: 300 })
  })

  it('AC27.1 Evening has no countdown, including after midnight', () => {
    expect(blockTimeLeft(at(17, 0))).toEqual({ block: 'evening', minutesLeft: null })
    expect(blockTimeLeft(at(2, 0))).toEqual({ block: 'evening', minutesLeft: null })
  })
})
