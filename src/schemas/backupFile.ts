import { z } from 'zod'
import type { ActivityEvent } from '@/types/activity'
import type { CalendarMapping } from '@/types/calendar'
import type { Closeout } from '@/types/closeout'
import type { Company } from '@/types/company'
import type { RecurringSeries } from '@/types/recurring'
import type { SettingRecord } from '@/types/settings'
import type { Task } from '@/types/task'
import type { VaultRecord } from '@/types/vault'
import { isValidDayKey } from '@/utils/dates'
import { isValidTime } from '@/utils/timeBlocks'

const encrypted = z.object({ iv: z.string(), data: z.string() })

// Backup files are untrusted input (Drive or a file the user picks). Dates and times are checked
// here, because the app parses them while rendering and a malformed one would crash Today.
const dayKey = z.string().refine(isValidDayKey, 'Invalid day.')
const time = z.string().refine(isValidTime, 'Invalid time.')

const task = z
  .object({
    id: z.string(),
    title: z.string(),
    notes: z.string(),
    companyId: z.string().nullable(),
    dayKey,
    block: z.enum(['morning', 'afternoon', 'evening']),
    order: z.number(),
    startTime: time.nullable(),
    durationMinutes: z.number().nullable(),
    status: z.enum(['todo', 'in_progress', 'done']),
    carriedOverCount: z.number(),
    carriedFromTaskId: z.string().nullable(),
    carriedToTaskId: z.string().nullable(),
    source: z.enum(['manual', 'calendar']),
    jiraIssue: z.object({ key: z.string(), title: z.string(), status: z.string() }).nullable(),
    // Version 1 files have no series (PRD AC20.7).
    seriesId: z.string().nullable().default(null),
    // Version 1 and 2 files have no due dates (PRD AC30.6).
    dueDate: dayKey.nullable().default(null),
    dueTime: time.nullable().default(null),
    createdAt: z.number(),
    updatedAt: z.number(),
  })
  .passthrough()

/** 0 = Sunday … 6 = Saturday. */
const weekday = z.number().int().min(0).max(6)

const series = z
  .object({
    id: z.string(),
    title: z.string(),
    notes: z.string(),
    companyId: z.string().nullable(),
    block: z.enum(['morning', 'afternoon', 'evening']),
    startTime: time.nullable(),
    durationMinutes: z.number().nullable(),
    jiraIssue: z.object({ key: z.string(), title: z.string(), status: z.string() }).nullable(),
    pattern: z.discriminatedUnion('kind', [
      z.object({ kind: z.literal('daily') }),
      z.object({ kind: z.literal('working_days') }),
      z.object({ kind: z.literal('weekly'), weekdays: z.array(weekday).min(1) }),
      z.object({ kind: z.literal('monthly'), dayOfMonth: z.number().int().min(1).max(31) }),
    ]),
    startDayKey: dayKey,
    endedFromDayKey: dayKey.nullable(),
    skippedDayKeys: z.array(dayKey),
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
      // A crafted value could make the key weak (too few) or hang the unlock (too many).
      iterations: z.number().int().min(100_000).max(10_000_000),
      salt: z.string(),
    }),
    passphraseWrappedKey: encrypted,
    keyCheck: encrypted,
    secrets: z.record(z.string(), encrypted),
    updatedAt: z.number(),
  })
  .nullable()

/**
 * Format written today. Version 2 adds repeating series (PRD FR20), version 3 adds due dates
 * (PRD FR30); older files still restore.
 */
export const BACKUP_VERSION = 3

/** Taskuda backup file, version 1, 2 or 3. Validated before anything is restored (design F8.6). */
export const backupFileSchema = z.object({
  format: z.literal('taskuda-backup'),
  version: z.union([z.literal(1), z.literal(2), z.literal(3)]),
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
    recurringSeries: z.array(series).default([]),
  }),
})

/** What a valid backup contains, in the app's own types. `backupFileSchema` checks it at runtime. */
export interface BackupFile {
  format: 'taskuda-backup'
  /** 1: before repeating tasks (no series); 2: before due dates (none on its tasks). */
  version: 1 | 2 | 3
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
    recurringSeries: RecurringSeries[]
  }
}
