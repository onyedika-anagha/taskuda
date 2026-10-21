import { useLiveQuery } from 'dexie-react-hooks'
import { useNow } from '@/hooks/useNow'
import { getScreenTime } from '@/services/db/screenTimeRepository'
import { budgetLevel, budgetText } from '@/services/screenTime/budgetWarning'
import { getDailyBudgetHours } from '@/services/workday/workdaySettings'
import { levelOn, useBudgetStore } from '@/stores/budgetStore'
import { toDayKey } from '@/utils/dates'

export interface BudgetWarning {
  message: string
  dismiss: () => void
}

/**
 * The budget banner on S2 (PRD AC29.3, design F17), or `null`. Dismiss hides it until the next
 * extra hour; nothing is ever blocked.
 */
export function useBudgetWarning(): BudgetWarning | null {
  const dayKey = toDayKey(new Date(useNow(60_000)))
  const dismissed = useBudgetStore((s) => levelOn(s.dismissed, dayKey))
  const dismiss = useBudgetStore((s) => s.dismiss)
  const data = useLiveQuery(async () => {
    const [budgetHours, totalMs] = await Promise.all([getDailyBudgetHours(), getScreenTime(dayKey)])
    return { budgetHours, totalMs }
  }, [dayKey])
  if (!data || data.budgetHours === null) return null
  const level = budgetLevel(data.totalMs, data.budgetHours)
  if (level === null || (dismissed !== null && dismissed >= level)) return null
  return { message: budgetText(level, data.budgetHours), dismiss: () => dismiss({ dayKey, level }) }
}
