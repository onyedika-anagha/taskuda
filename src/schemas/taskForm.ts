import { z } from 'zod'
import { TASK_TITLE_MAX_LENGTH } from '@/services/db/taskRepository'
import { TIME_BLOCKS } from '@/types/task'

/** `none` is the Select value for "No company". */
export const NO_COMPANY = 'none'

/** Repeat select values (design spec Section 8, Repeat options). */
export const REPEAT_OPTIONS = ['none', 'daily', 'working_days', 'weekly', 'monthly'] as const
export type RepeatOption = (typeof REPEAT_OPTIONS)[number]

/** Task editor form (design S3). Empty strings mean "not set" for the optional fields. */
export const taskFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Give the task a title.')
      .max(TASK_TITLE_MAX_LENGTH, `Keep the title under ${TASK_TITLE_MAX_LENGTH} characters.`),
    companyId: z.string(),
    block: z.enum(TIME_BLOCKS),
    startTime: z.union([
      z.literal(''),
      z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use a valid start time.'),
    ]),
    durationMinutes: z.union([
      z.literal(''),
      z
        .string()
        .regex(/^\d+$/, 'Enter the duration in whole minutes.')
        .refine((v) => Number(v) > 0 && Number(v) <= 24 * 60, 'Enter between 1 and 1440 minutes.'),
    ]),
    notes: z.string().max(2000, 'Keep notes under 2,000 characters.'),
    /** Set from the Link Jira issue dialog (D7), never typed. */
    jiraIssue: z.object({ key: z.string(), title: z.string(), status: z.string() }).nullable(),
    /** PRD AC20.1. Weekdays are 0 = Sunday … 6 = Saturday; the day of the month is "1"–"31". */
    repeat: z.enum(REPEAT_OPTIONS),
    repeatWeekdays: z.array(z.number().int().min(0).max(6)),
    repeatDay: z.string().regex(/^([1-9]|[12]\d|3[01])$/, 'Pick a day of the month.'),
  })
  .refine((v) => v.repeat !== 'weekly' || v.repeatWeekdays.length > 0, {
    message: 'Pick at least one day.',
    path: ['repeatWeekdays'],
  })

export type TaskFormValues = z.infer<typeof taskFormSchema>
