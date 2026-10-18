import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { todayKey } from '@/utils/dates'
import { closeoutStreak, medianMinutesToReport, silentlyDroppedCount, windowStart } from '@/utils/metrics'

export interface Metrics {
  /** M1 */
  droppedCount: number
  /** M2 */
  streak: number
  /** M3; `null` until a report has been copied during a closeout. */
  medianMinutes: number | null
  hasCloseouts: boolean
}

/** M1–M3 from local data only (PRD FR17). `undefined` while loading. */
export function useMetrics(): Metrics | undefined {
  return useLiveQuery(async () => {
    const today = todayKey()
    const [tasks, closeouts] = await Promise.all([
      db.tasks.where('dayKey').between(windowStart(today), today, true, false).toArray(),
      db.closeouts.toArray(),
    ])
    return {
      droppedCount: silentlyDroppedCount(tasks, today),
      streak: closeoutStreak(
        closeouts.map((c) => c.dayKey),
        today,
      ),
      medianMinutes: medianMinutesToReport(closeouts, today),
      hasCloseouts: closeouts.length > 0,
    }
  }, [])
}
