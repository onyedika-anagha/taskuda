import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { carryoverInsights, type CarryoverInsights } from '@/utils/carryoverInsights'
import { todayKey } from '@/utils/dates'
import { windowStart } from '@/utils/metrics'

/**
 * Carry-over insights from local data only (PRD FR26, AC26.4). Reads the 4-week window and later
 * days, since the tasks carried 3+ times now sit on today or ahead. `undefined` while loading.
 */
export function useCarryoverInsights(): CarryoverInsights | undefined {
  return useLiveQuery(async () => {
    const today = todayKey()
    const tasks = await db.tasks.where('dayKey').aboveOrEqual(windowStart(today)).toArray()
    return carryoverInsights(tasks, today)
  }, [])
}
