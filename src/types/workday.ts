/** Day of the week as date-fns `getDay` numbers it: 0 = Sunday … 6 = Saturday. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

/** Display order, Monday first. */
export const WEEKDAYS: readonly Weekday[] = [1, 2, 3, 4, 5, 6, 0]

/** PRD AC19.1: Monday to Friday unless the user changes it. */
export const DEFAULT_WORKING_DAYS: readonly Weekday[] = [1, 2, 3, 4, 5]
