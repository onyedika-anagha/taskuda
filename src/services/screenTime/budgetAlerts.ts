import { toast } from 'sonner'
import { getScreenTime } from '@/services/db/screenTimeRepository'
import { getDailyBudgetHours } from '@/services/workday/workdaySettings'
import { levelOn, useBudgetStore } from '@/stores/budgetStore'
import { toDayKey } from '@/utils/dates'
import { budgetLevel, budgetText, shouldWarn } from './budgetWarning'

/** The gentle toast when today's time passes the budget, then once per extra hour (PRD AC29.3). */
export async function checkBudget(now = Date.now()): Promise<void> {
  const dayKey = toDayKey(new Date(now))
  const [budgetHours, totalMs] = await Promise.all([getDailyBudgetHours(), getScreenTime(dayKey)])
  const level = budgetLevel(totalMs, budgetHours)
  const store = useBudgetStore.getState()
  if (level === null || budgetHours === null) return
  if (!shouldWarn(level, levelOn(store.warned, dayKey))) return
  store.markWarned({ dayKey, level })
  toast(budgetText(level, budgetHours))
}
