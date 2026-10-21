import { describe, expect, it } from 'vitest'
import { budgetLevel, budgetText, shouldWarn } from './budgetWarning'

const HOUR = 3_600_000

describe('budget warning (PRD AC29.3)', () => {
  it('has no level while under the budget or with no budget', () => {
    expect(budgetLevel(2 * HOUR - 1, 2)).toBeNull()
    expect(budgetLevel(10 * HOUR, null)).toBeNull()
  })

  it('reaches the first level at the budget, then one more per extra hour', () => {
    expect(budgetLevel(2 * HOUR, 2)).toBe(2)
    expect(budgetLevel(2.9 * HOUR, 2)).toBe(2)
    expect(budgetLevel(3 * HOUR, 2)).toBe(3)
  })

  it('warns the first time, then at most once per extra hour', () => {
    expect(shouldWarn(2, null)).toBe(true)
    expect(shouldWarn(2, 2)).toBe(false)
    expect(shouldWarn(3, 2)).toBe(true)
    expect(shouldWarn(null, null)).toBe(false)
  })

  it('names the time spent and the budget', () => {
    expect(budgetText(3, 2)).toBe(
      'You’ve spent 3 h in Taskuda today, past your 2 h budget. A short break might help.',
    )
  })
})
