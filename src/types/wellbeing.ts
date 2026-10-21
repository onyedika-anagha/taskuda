/** How an eye-break prompt ended (PRD AC28.3). */
export type EyeBreakOutcome = 'done' | 'snoozed' | 'dismissed' | 'missed'

/** One row in the eye-break log used for M4. Kept on this device only (not backed up). */
export interface EyeBreakLogEntry {
  id?: number
  /** When the outcome happened (ms). */
  at: number
  /** Local day, `yyyy-MM-dd`. */
  dayKey: string
  outcome: EyeBreakOutcome
}

/** Time Taskuda was visible on one day on this device (PRD AC29.1). Not backed up. */
export interface ScreenTimeDay {
  dayKey: string
  ms: number
}
