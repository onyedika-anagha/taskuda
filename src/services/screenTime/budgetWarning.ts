import type { BudgetHours } from '@/types/workday'

const HOUR_MS = 3_600_000

/**
 * Whole hours spent in Taskuda today once the budget is reached, or `null` while under it.
 * Each new value is one more warning (PRD AC29.3): 2 h, then 3 h, then 4 h.
 */
export function budgetLevel(totalMs: number, budgetHours: BudgetHours | null): number | null {
  if (budgetHours === null || totalMs < budgetHours * HOUR_MS) return null
  return Math.floor(totalMs / HOUR_MS)
}

/** Warn the first time the budget is passed today, then at most once per extra hour. */
export function shouldWarn(level: number | null, lastWarnedLevel: number | null): boolean {
  return level !== null && (lastWarnedLevel === null || level > lastWarnedLevel)
}

/** Banner and toast copy (design spec Section 8). */
export function budgetText(level: number, budgetHours: BudgetHours): string {
  return `You’ve spent ${level} h in Taskuda today, past your ${budgetHours} h budget. A short break might help.`
}
