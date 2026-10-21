import { describe, expect, it } from 'vitest'
import { DEFAULT_EYE_BREAKS, DEFAULT_QUIET_HOURS, DEFAULT_WORKING_DAYS } from '@/types/workday'
import { decideEyeBreak, nextEyeBreakAt, type EyeBreakState } from './eyeBreakPlan'

// 2026-10-21 is a Wednesday; 2026-10-24 a Saturday.
const at = (h: number, m: number, day = 21) => new Date(2026, 9, day, h, m).getTime()

function state(overrides: Partial<EyeBreakState> = {}): EyeBreakState {
  return {
    now: at(10, 0),
    settings: { ...DEFAULT_EYE_BREAKS, enabled: true },
    workingDays: DEFAULT_WORKING_DAYS,
    quietHours: DEFAULT_QUIET_HOURS,
    lastPromptAt: null,
    snoozedUntil: null,
    openedAt: at(9, 0),
    visible: true,
    ...overrides,
  }
}

describe('nextEyeBreakAt (PRD AC28.2)', () => {
  it('counts one interval from the last prompt', () => {
    expect(nextEyeBreakAt(state({ lastPromptAt: at(9, 40) }))).toBe(at(10, 0))
  })

  it('never counts from before Taskuda was opened or the eye-break hours began', () => {
    expect(nextEyeBreakAt(state({ openedAt: at(9, 50), lastPromptAt: at(8, 0, 20) }))).toBe(at(10, 10))
    expect(nextEyeBreakAt(state({ now: at(9, 5), openedAt: at(7, 0) }))).toBe(at(9, 20))
  })

  it('a snooze sets the next time', () => {
    expect(nextEyeBreakAt(state({ lastPromptAt: at(9, 55), snoozedUntil: at(10, 0) }))).toBe(at(10, 0))
  })
})

describe('decideEyeBreak (PRD FR28, design F15)', () => {
  const cases: [string, Partial<EyeBreakState>, ReturnType<typeof decideEyeBreak>][] = [
    [
      'AC28.2 prompts when the interval is up',
      { lastPromptAt: at(9, 40) },
      { type: 'prompt', missed: false },
    ],
    ['waits until the interval is up', { lastPromptAt: at(9, 45) }, { type: 'wait' }],
    ['AC28.1 does nothing while eye breaks are off', { settings: DEFAULT_EYE_BREAKS }, { type: 'wait' }],
    ['AC19.4 does nothing on a day off', { now: at(10, 0, 24), openedAt: at(9, 0, 24) }, { type: 'wait' }],
    ['does nothing outside eye-break hours', { now: at(17, 30), lastPromptAt: at(16, 0) }, { type: 'wait' }],
    ['AC28.5 waits while Taskuda is in the background', { visible: false }, { type: 'wait' }],
    [
      'AC28.5 shows once as missed when the user comes back late',
      { now: at(10, 30), lastPromptAt: at(9, 40) },
      { type: 'prompt', missed: true },
    ],
    [
      'AC28.4 / AC23.3 skips during quiet hours',
      { quietHours: { enabled: true, start: '09:30', end: '11:00' }, lastPromptAt: at(9, 40) },
      { type: 'skip' },
    ],
    [
      'a snooze comes back after 5 minutes',
      { lastPromptAt: at(9, 59), snoozedUntil: at(10, 0) },
      { type: 'prompt', missed: false },
    ],
  ]

  it.each(cases)('%s', (_name, overrides, expected) => {
    expect(decideEyeBreak(state(overrides))).toEqual(expected)
  })

  it('works across midnight for overnight eye-break hours', () => {
    const overnight = { ...DEFAULT_EYE_BREAKS, enabled: true, start: '22:00', end: '02:00' }
    expect(
      decideEyeBreak(
        state({ settings: overnight, now: at(0, 30), openedAt: at(21, 0, 20), lastPromptAt: at(0, 10) }),
      ),
    ).toEqual({ type: 'prompt', missed: false })
  })
})
