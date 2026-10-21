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
  deadlinesMet,
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
  /** M6, 0–1; `null` until a task with a due date has come due in the window. */
  deadlineRate: number | null
}

/** The latest change to Done for each task (M6). */
async function doneTimes(taskIds: string[]): Promise<Map<string, number>> {
  const events = await db.activityLog.where('taskId').anyOf(taskIds).toArray()
  const doneAt = new Map<string, number>()
  for (const e of events) {
    if (e.type === 'task_status_changed' && e.data?.to === 'done') {
      doneAt.set(e.taskId, Math.max(doneAt.get(e.taskId) ?? 0, e.at))
    }
  }
  return doneAt
}

/** M1–M6 from local data only (PRD FR17). `undefined` while loading. */
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
    // No index on the due date: a scan is fine at one person's scale.
    const withDue = await db.tasks.filter((t) => t.dueDate !== null && t.dueDate >= start).toArray()
    const doneAt = await doneTimes(withDue.map((t) => t.id))
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
      deadlineRate: deadlinesMet(withDue, doneAt, Date.now()),
    }
  }, [])
}
