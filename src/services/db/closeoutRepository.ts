import type { Closeout } from '@/types/closeout'
import { db } from './database'

export function getCloseout(dayKey: string): Promise<Closeout | undefined> {
  return db.closeouts.get(dayKey)
}

/** One closeout per day: closing out again replaces the earlier entry. */
export async function saveCloseout(closeout: Closeout): Promise<void> {
  await db.closeouts.put(closeout)
}

/** Records the first time the day's report was copied (M3); later copies don't change it. */
export async function recordReportCopied(dayKey: string, at: number = Date.now()): Promise<void> {
  await db.transaction('rw', db.closeouts, async () => {
    const closeout = await db.closeouts.get(dayKey)
    if (closeout && closeout.reportCopiedAt === null)
      await db.closeouts.update(dayKey, { reportCopiedAt: at })
  })
}

export function listCloseouts(): Promise<Closeout[]> {
  return db.closeouts.orderBy('dayKey').toArray()
}
