import { describe, expect, it, vi } from 'vitest'
import { createScreenTimeTracker, splitByDay } from './screenTimeTracker'

const at = (day: number, h: number, m: number) => new Date(2026, 9, day, h, m).getTime()
const MIN = 60_000

function setUp() {
  const saved = new Map<string, number>()
  const save = vi.fn<(byDay: Map<string, number>) => Promise<void>>(async (byDay) => {
    for (const [day, ms] of byDay) saved.set(day, (saved.get(day) ?? 0) + ms)
  })
  return { tracker: createScreenTimeTracker(save), saved, save }
}

describe('screen time tracker (PRD AC29.1)', () => {
  it('counts only the time Taskuda is visible', async () => {
    const { tracker, saved } = setUp()
    tracker.start(at(21, 9, 0))
    await tracker.flush(at(21, 9, 1))
    await tracker.stop(at(21, 9, 10)) // hidden for 50 minutes
    await tracker.flush(at(21, 10, 0)) // nothing counts while hidden
    tracker.start(at(21, 10, 0))
    await tracker.stop(at(21, 10, 5))
    expect(saved.get('2026-10-21')).toBe(15 * MIN)
  })

  it('a second start while already visible keeps the original start', async () => {
    const { tracker, saved } = setUp()
    tracker.start(at(21, 9, 0))
    tracker.start(at(21, 9, 5))
    await tracker.stop(at(21, 9, 10))
    expect(saved.get('2026-10-21')).toBe(10 * MIN)
  })

  it('saves nothing when nothing was visible', async () => {
    const { tracker, save } = setUp()
    await tracker.flush(at(21, 9, 0))
    await tracker.stop(at(21, 9, 5))
    expect(save).not.toHaveBeenCalled()
  })

  it('splits a session across midnight between the two days', () => {
    expect(splitByDay(at(20, 23, 50), at(21, 0, 15))).toEqual(
      new Map([
        ['2026-10-20', 10 * MIN],
        ['2026-10-21', 15 * MIN],
      ]),
    )
  })
})
