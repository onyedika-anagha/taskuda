import { z } from 'zod'
import { TASK_TITLE_MAX_LENGTH } from '@/services/db/taskRepository'
import { TIME_BLOCKS } from '@/types/task'

/** `none` is the Select value for "No company". */
export const NO_COMPANY = 'none'

/** Task editor form (design S3). Empty strings mean "not set" for the optional fields. */
export const taskFormSchema = z.object({
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
})

export type TaskFormValues = z.infer<typeof taskFormSchema>
