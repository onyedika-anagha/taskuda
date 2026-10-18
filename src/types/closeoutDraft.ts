import type { Recommendation } from './ai'
import type { TaskOutcome } from './closeout'

export const CLOSEOUT_STEPS = ['unfinished', 'reflect', 'recommendations', 'report'] as const
export type CloseoutStep = (typeof CLOSEOUT_STEPS)[number]

/** An unfinished closeout, saved after every change so it can be resumed (design F5.7, DAC13). */
export interface CloseoutDraft {
  dayKey: string
  step: CloseoutStep
  /** "Start closeout" time, for M3. */
  startedAt: number
  outcomes: Record<string, TaskOutcome>
  rating: number | null
  reflection: string
  /** First copy of the report during this closeout, for M3. */
  reportCopiedAt: number | null
  /** Kept so going back and forth doesn't ask the AI again. */
  recommendations: Recommendation[] | null
}
