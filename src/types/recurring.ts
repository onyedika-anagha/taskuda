import type { JiraIssueLink, TimeBlock } from './task'
import type { Weekday } from './workday'

/** The four patterns of PRD AC20.1. */
export type RepeatPattern =
  | { kind: 'daily' }
  | { kind: 'working_days' }
  /** One or more weekdays. */
  | { kind: 'weekly'; weekdays: Weekday[] }
  /** 1–31; months without that date use their last day. */
  | { kind: 'monthly'; dayOfMonth: number }

export type RepeatKind = RepeatPattern['kind']

/**
 * A repeating task (PRD FR20). Each matching day from today on gets a real task with this
 * `seriesId` when the day is shown, so every task feature works on occurrences unchanged.
 */
export interface RecurringSeries {
  id: string
  title: string
  notes: string
  companyId: string | null
  block: TimeBlock
  startTime: string | null
  durationMinutes: number | null
  jiraIssue: JiraIssueLink | null
  pattern: RepeatPattern
  /** First day of the series, `yyyy-MM-dd`. */
  startDayKey: string
  /** The series stops from this day on ("This and future tasks", AC20.5); `null` while it runs. */
  endedFromDayKey: string | null
  /** Days whose occurrence was deleted on its own ("This task only"), so it isn't created again. */
  skippedDayKeys: string[]
  createdAt: number
  updatedAt: number
}

/** The fields an occurrence copies from its series. */
export type SeriesTemplate = Pick<
  RecurringSeries,
  'title' | 'notes' | 'companyId' | 'block' | 'startTime' | 'durationMinutes' | 'jiraIssue'
>
