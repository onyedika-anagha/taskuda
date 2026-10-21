/** Day of the week as date-fns `getDay` numbers it: 0 = Sunday … 6 = Saturday. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

/** Display order, Monday first. */
export const WEEKDAYS: readonly Weekday[] = [1, 2, 3, 4, 5, 6, 0]

/** PRD AC19.1: Monday to Friday unless the user changes it. */
export const DEFAULT_WORKING_DAYS: readonly Weekday[] = [1, 2, 3, 4, 5]

/** A daily time range, `HH:mm`. When `start` is later than `end` it runs overnight. */
export interface TimeRange {
  start: string
  end: string
}

export interface QuietHours extends TimeRange {
  enabled: boolean
}

/** PRD AC28.1: minutes between eye-break prompts. */
export const EYE_BREAK_INTERVALS = [20, 30, 45, 60] as const
export type EyeBreakInterval = (typeof EYE_BREAK_INTERVALS)[number]

/** PRD FR28: prompts on working days, inside `start`–`end`, every `intervalMinutes`. */
export interface EyeBreakSettings extends TimeRange {
  enabled: boolean
  intervalMinutes: EyeBreakInterval
}

/** PRD AC29.2: the daily budget for time in Taskuda; `null` is Off. */
export const BUDGET_HOURS = [1, 2, 3, 4] as const
export type BudgetHours = (typeof BUDGET_HOURS)[number]

export interface WorkdaySettings {
  workingDays: Weekday[]
  /** PRD FR21: `HH:mm`, or `null` when off. */
  closeoutReminder: string | null
  /** PRD FR23. */
  quietHours: QuietHours
  /** PRD FR28. */
  eyeBreaks: EyeBreakSettings
  /** PRD FR29. */
  dailyBudgetHours: BudgetHours | null
}

export const DEFAULT_CLOSEOUT_REMINDER = '17:30'
export const DEFAULT_QUIET_HOURS: QuietHours = { enabled: false, start: '22:00', end: '07:00' }
export const DEFAULT_EYE_BREAKS: EyeBreakSettings = {
  enabled: false,
  intervalMinutes: 20,
  start: '09:00',
  end: '17:00',
}
