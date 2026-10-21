import type { ScreenTimeDay } from '@/types/wellbeing'
import { db } from './database'

/** Adds visible time to each day's total, in one transaction (PRD AC29.1). */
export async function addScreenTime(byDay: Map<string, number>): Promise<void> {
  if (!byDay.size) return
  await db.transaction('rw', db.screenTime, async () => {
    for (const [dayKey, ms] of byDay) {
      const current = await db.screenTime.get(dayKey)
      await db.screenTime.put({ dayKey, ms: (current?.ms ?? 0) + ms })
    }
  })
}

export async function getScreenTime(dayKey: string): Promise<number> {
  return (await db.screenTime.get(dayKey))?.ms ?? 0
}

/** Days from `fromDayKey` up to and including `toDayKey`. Days without a row had no time. */
export function listScreenTime(fromDayKey: string, toDayKey: string): Promise<ScreenTimeDay[]> {
  return db.screenTime.where('dayKey').between(fromDayKey, toDayKey, true, true).toArray()
}
