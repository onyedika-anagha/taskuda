import { describe, expect, it } from 'vitest'
import { makeCompany, makeTask } from '@/test/factories'
import {
  carriedOverLabel,
  formatDayLong,
  formatDayShort,
  formatDuration,
  formatTime,
  taskAriaLabel,
} from './taskPresentation'

describe('taskPresentation', () => {
  it('formats times and days for people', () => {
    expect(formatTime('14:00')).toBe('2:00 PM')
    expect(formatTime('09:05')).toBe('9:05 AM')
    expect(formatDayShort('2026-10-14')).toBe('Wed, Oct 14')
    expect(formatDayLong('2026-10-19')).toBe('Monday, Oct 19')
  })

  it('formats durations', () => {
    expect(formatDuration(30)).toBe('30 min')
    expect(formatDuration(60)).toBe('1 h')
    expect(formatDuration(90)).toBe('1 h 30 min')
  })

  it('AC11.2 shows how many times a task was carried', () => {
    expect(carriedOverLabel(1)).toBe('Carried over')
    expect(carriedOverLabel(2)).toBe('Carried over ×2')
  })

  it('builds the screen-reader label from design spec Section 7', () => {
    const task = makeTask({ startTime: '14:00', status: 'in_progress' })
    expect(taskAriaLabel(task, makeCompany())).toBe('Client call, Acme, 2:00 PM, In Progress')
    expect(taskAriaLabel(makeTask({ carriedOverCount: 2, source: 'calendar' }), undefined)).toBe(
      'Client call, To Do, carried over 2 times, from Google Calendar',
    )
  })
})
