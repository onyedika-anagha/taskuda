import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { listEyeBreaksSince } from '@/services/db/eyeBreakRepository'
import { listScreenTime } from '@/services/db/screenTimeRepository'
import { getDailyBudgetHours, getEyeBreaks, getWorkingDays } from '@/services/workday/workdaySettings'
import type { BudgetHours } from '@/types/workday'
import { todayKey } from '@/utils/dates'
import {
  closeoutStreak,
  daysWithinBudget,
  eyeBreakFollowThrough,
  medianMinutesToReport,
  sevenDayAverageMs,
  silentlyDroppedCount,
  windowStart,
} from '@/utils/metrics'

export interface Metrics {
  /** M1 */
  droppedCount: number
  /** M2 */
  streak: number
  /** M3; `null` until a report has been copied during a closeout. */
  medianMinutes: number | null
  hasCloseouts: boolean
  eyeBreaksOn: boolean
  /** M4, 0–1; `null` until a prompt has ended. */
  eyeBreakRate: number | null
  budgetHours: BudgetHours | null
  /** M5, 0–1; `null` until a past working day has time recorded. */
  budgetRate: number | null
  /** Time in Taskuda on this device (PRD AC29.4). */
  todayMs: number
  averageMs: number
}

/** M1–M5 from local data only (PRD FR17). `undefined` while loading. */
export function useMetrics(): Metrics | undefined {
  return useLiveQuery(async () => {
    const today = todayKey()
    const start = windowStart(today)
    const [tasks, closeouts, workingDays, eyeBreaks, budgetHours, eyeBreakLog, screenTime] =
      await Promise.all([
        db.tasks.where('dayKey').between(start, today, true, false).toArray(),
        db.closeouts.toArray(),
        getWorkingDays(),
        getEyeBreaks(),
        getDailyBudgetHours(),
        listEyeBreaksSince(start),
        listScreenTime(start, today),
      ])
    return {
      droppedCount: silentlyDroppedCount(tasks, today),
      streak: closeoutStreak(
        closeouts.map((c) => c.dayKey),
        today,
        workingDays,
      ),
      medianMinutes: medianMinutesToReport(closeouts, today),
      hasCloseouts: closeouts.length > 0,
      eyeBreaksOn: eyeBreaks.enabled,
      eyeBreakRate: eyeBreakFollowThrough(eyeBreakLog, today),
      budgetHours,
      budgetRate: budgetHours === null ? null : daysWithinBudget(screenTime, today, budgetHours, workingDays),
      todayMs: screenTime.find((d) => d.dayKey === today)?.ms ?? 0,
      averageMs: sevenDayAverageMs(screenTime, today),
    }
  }, [])
}
