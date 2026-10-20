import { describe, expect, it } from 'vitest'
import { DEFAULT_WORKING_DAYS } from '@/types/workday'
import { isNudgeDue, nudgeText, shouldAlertNudge, type NudgeState } from './closeoutNudge'

// Tuesday, Oct 20, 2026; Saturday, Oct 24.
const tuesday = (h: number, m = 0) => new Date(2026, 9, 20, h, m)

const state = (overrides: Partial<NudgeState> = {}): NudgeState => ({
  now: tuesday(17, 30),
  reminderTime: '17:30',
  workingDays: DEFAULT_WORKING_DAYS,
  closedToday: false,
  dismissedDay: null,
  ...overrides,
})

describe('closeout nudge decision (PRD FR21)', () => {
  it('AC21.2 is due on a working day from the nudge time, until the day is closed', () => {
    expect(isNudgeDue(state({ now: tuesday(17, 29) }))).toBe(false)
    expect(isNudgeDue(state())).toBe(true)
    expect(isNudgeDue(state({ now: tuesday(21, 0) }))).toBe(true)
    expect(isNudgeDue(state({ closedToday: true }))).toBe(false)
  })

  it('AC21.1 / AC19.4 is never due when off or on a day off', () => {
    expect(isNudgeDue(state({ reminderTime: null }))).toBe(false)
    expect(isNudgeDue(state({ now: new Date(2026, 9, 24, 18, 0) }))).toBe(false)
  })

  it('AC21.3 “Not today” hides it for that day only', () => {
    expect(isNudgeDue(state({ dismissedDay: '2026-10-20' }))).toBe(false)
    expect(isNudgeDue(state({ dismissedDay: '2026-10-19' }))).toBe(true)
  })

  it('AC21.2 / AC21.3 alerts once, when Taskuda is open and visible at the nudge time', () => {
    expect(shouldAlertNudge(state({ now: tuesday(17, 31) }), null, true)).toBe(true)
    expect(shouldAlertNudge(state(), '2026-10-20', true)).toBe(false)
    expect(shouldAlertNudge(state(), null, false)).toBe(false)
  })

  it('AC21.4 opened later that day: banner only, no alert', () => {
    const later = state({ now: tuesday(19, 0) })
    expect(isNudgeDue(later)).toBe(true)
    expect(shouldAlertNudge(later, null, true)).toBe(false)
  })

  it('uses the design copy', () => {
    expect(nudgeText('17:30')).toEqual({
      message: 'It’s 5:30 PM. Ready to close out your day?',
      voice: 'It’s 5:30 PM. Time to close out your day.',
    })
  })
})
