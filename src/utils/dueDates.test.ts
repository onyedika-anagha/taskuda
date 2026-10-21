import { describe, expect, it } from 'vitest'
import { dueLabel, dueMoment, dueSpokenLabel, isDuePassed, localMoment } from './dueDates'

const TODAY = '2026-10-21' // a Wednesday

describe('dueDates', () => {
  it('AC30.1 a due date with no time is due at the end of that day', () => {
    const due = dueMoment({ dueDate: TODAY, dueTime: null })!
    expect(isDuePassed({ dueDate: TODAY, dueTime: null }, localMoment(TODAY, '23:59'))).toBe(false)
    expect(isDuePassed({ dueDate: TODAY, dueTime: null }, due + 1)).toBe(true)
  })

  it('a due time makes the task due at that minute', () => {
    const task = { dueDate: TODAY, dueTime: '17:00' }
    expect(dueMoment(task)).toBe(localMoment(TODAY, '17:00'))
    expect(isDuePassed(task, localMoment(TODAY, '17:00'))).toBe(false)
    expect(isDuePassed(task, localMoment(TODAY, '17:01'))).toBe(true)
  })

  it('a task without a due date is never due', () => {
    expect(dueMoment({ dueDate: null, dueTime: null })).toBeNull()
    expect(isDuePassed({ dueDate: null, dueTime: null }, Date.now())).toBe(false)
    expect(dueLabel({ dueDate: null, dueTime: null }, TODAY)).toBeNull()
  })

  it.each([
    [TODAY, null, 'Due today'],
    [TODAY, '17:00', 'Due today 5:00 PM'],
    ['2026-10-22', null, 'Due tomorrow'],
    ['2026-10-22', '09:00', 'Due tomorrow 9:00 AM'],
    ['2026-10-24', null, 'Due Sat, Oct 24'],
    ['2026-10-23', '17:00', 'Due Fri, Oct 23, 5:00 PM'],
  ])('AC30.2 labels %s %s as "%s"', (dueDate, dueTime, label) => {
    expect(dueLabel({ dueDate, dueTime }, TODAY)).toBe(label)
  })

  it('spoken labels use full day names', () => {
    expect(dueSpokenLabel({ dueDate: TODAY, dueTime: '17:00' }, TODAY)).toBe('due today at 5:00 PM')
    expect(dueSpokenLabel({ dueDate: '2026-10-23', dueTime: null }, TODAY)).toBe('due Friday, October 23')
  })

  it('treats a malformed due date or time as no due date instead of throwing', () => {
    expect(dueMoment({ dueDate: 'not-a-date', dueTime: null })).toBeNull()
    expect(dueMoment({ dueDate: TODAY, dueTime: '9am' })).toBeNull()
    expect(isDuePassed({ dueDate: 'not-a-date', dueTime: null }, Date.now())).toBe(false)
  })
})
