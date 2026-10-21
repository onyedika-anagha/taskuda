/** PRD AC31.1, in the AC31.2 priority order: a note shows only the first that applies. */
export const RISK_KINDS = ['overdue', 'overran', 'running_late', 'due_today', 'stuck'] as const
export type RiskKind = (typeof RISK_KINDS)[number]

/** Design Section 10: Overdue and Overran use the strong style, the rest the standard one. */
export type RiskStrength = 'strong' | 'standard'

export interface AtRiskTask<T> {
  task: T
  kind: RiskKind
}
