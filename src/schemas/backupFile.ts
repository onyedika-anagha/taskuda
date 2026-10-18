import { z } from 'zod'
import type { ActivityEvent } from '@/types/activity'
import type { CalendarMapping } from '@/types/calendar'
import type { Closeout } from '@/types/closeout'
import type { Company } from '@/types/company'
import type { SettingRecord } from '@/types/settings'
import type { Task } from '@/types/task'
import type { VaultRecord } from '@/types/vault'

const encrypted = z.object({ iv: z.string(), data: z.string() })

const task = z
  .object({
    id: z.string(),
    title: z.string(),
    notes: z.string(),
    companyId: z.string().nullable(),
    dayKey: z.string(),
    block: z.enum(['morning', 'afternoon', 'evening']),
    order: z.number(),
    startTime: z.string().nullable(),
    durationMinutes: z.number().nullable(),
    status: z.enum(['todo', 'in_progress', 'done']),
    carriedOverCount: z.number(),
    carriedFromTaskId: z.string().nullable(),
    carriedToTaskId: z.string().nullable(),
    source: z.enum(['manual', 'calendar']),
    jiraIssue: z.object({ key: z.string(), title: z.string(), status: z.string() }).nullable(),
    createdAt: z.number(),
    updatedAt: z.number(),
  })
  .passthrough()

const company = z
  .object({
    id: z.string(),
    name: z.string(),
    colorId: z.string(),
    createdAt: z.number(),
    updatedAt: z.number(),
  })
  .passthrough()

const closeout = z
  .object({
    dayKey: z.string(),
    startedAt: z.number(),
    finishedAt: z.number(),
    reportCopiedAt: z.number().nullable(),
    rating: z.number(),
    reflection: z.string(),
    outcomes: z.record(z.string(), z.enum(['carry_over', 'delete'])),
  })
  .passthrough()

const activity = z
  .object({
    id: z.number().optional(),
    at: z.number(),
    type: z.string(),
    taskId: z.string(),
    dayKey: z.string(),
  })
  .passthrough()

const vault = z
  .object({
    id: z.literal('vault'),
    version: z.literal(1),
    kdf: z.object({
      name: z.literal('PBKDF2'),
      hash: z.literal('SHA-256'),
      iterations: z.number(),
      salt: z.string(),
    }),
    passphraseWrappedKey: encrypted,
    keyCheck: encrypted,
    secrets: z.record(z.string(), encrypted),
    updatedAt: z.number(),
  })
  .nullable()

/** Taskuda backup file, version 1. Validated before anything is restored (design F8.6). */
export const backupFileSchema = z.object({
  format: z.literal('taskuda-backup'),
  version: z.literal(1),
  createdAt: z.number(),
  deviceId: z.string(),
  deviceName: z.string(),
  data: z.object({
    tasks: z.array(task),
    companies: z.array(company),
    closeouts: z.array(closeout),
    activityLog: z.array(activity),
    settings: z.array(z.object({ key: z.string(), value: z.unknown() })),
    calendarMappings: z.array(z.object({ taskId: z.string(), eventId: z.string() }).passthrough()),
    vault,
  }),
})

/** What a valid backup contains, in the app's own types. `backupFileSchema` checks it at runtime. */
export interface BackupFile {
  format: 'taskuda-backup'
  version: 1
  createdAt: number
  deviceId: string
  deviceName: string
  data: {
    tasks: Task[]
    companies: Company[]
    closeouts: Closeout[]
    activityLog: ActivityEvent[]
    settings: SettingRecord[]
    calendarMappings: CalendarMapping[]
    vault: VaultRecord | null
  }
}
