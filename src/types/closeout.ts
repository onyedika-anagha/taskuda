export type TaskOutcome = 'carry_over' | 'delete'

export interface Closeout {
  /** One closeout per day; `yyyy-MM-dd`. */
  dayKey: string
  startedAt: number
  finishedAt: number
  reportCopiedAt: number | null
  /** 1 (rough) to 5 (great). */
  rating: number
  reflection: string
  outcomes: Record<string, TaskOutcome>
}
