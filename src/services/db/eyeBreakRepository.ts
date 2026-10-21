import type { EyeBreakLogEntry, EyeBreakOutcome } from '@/types/wellbeing'
import { toDayKey } from '@/utils/dates'
import { db } from './database'

/** Saves how an eye-break prompt ended (PRD AC28.3). */
export async function logEyeBreak(outcome: EyeBreakOutcome, at = Date.now()): Promise<void> {
  await db.eyeBreakLog.add({ at, dayKey: toDayKey(new Date(at)), outcome })
}

/** Log rows from `fromDayKey` onward. */
export function listEyeBreaksSince(fromDayKey: string): Promise<EyeBreakLogEntry[]> {
  return db.eyeBreakLog.where('dayKey').aboveOrEqual(fromDayKey).toArray()
}
