export const REPORT_FORMATS = ['slack', 'teams', 'jira', 'email'] as const
export type ReportFormat = (typeof REPORT_FORMATS)[number]

/** `all` or a company id. */
export type ReportScope = 'all' | string

export interface ReportItem {
  title: string
  jiraKey: string | null
}

export interface ReportGroup {
  /** Company name; `null` for a single-company report or tasks with no company. */
  heading: string | null
  done: ReportItem[]
  inProgress: ReportItem[]
  carried: ReportItem[]
}

/** Totals for the summary line of an all-companies report (PRD FR24). */
export interface ReportSummary {
  done: number
  inProgress: number
  carried: number
  /** Companies with something in the report; tasks without a company don't count. */
  companies: number
}

export interface ReportData {
  dayKey: string
  /** Company name for a single-company report. */
  scopeName: string | null
  /** The next working day, where carried tasks go (PRD AC11.1). */
  carriedToDayKey: string
  /** All-companies reports only (PRD AC24.3). */
  summary: ReportSummary | null
  groups: ReportGroup[]
}
