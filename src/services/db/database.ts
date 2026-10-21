import { Dexie, type EntityTable } from 'dexie'
import type { ActivityEvent } from '@/types/activity'
import type { CalendarMapping } from '@/types/calendar'
import type { Closeout } from '@/types/closeout'
import type { Company } from '@/types/company'
import type { SettingRecord } from '@/types/settings'
import type { Task } from '@/types/task'
import type { RecurringSeries } from '@/types/recurring'
import type { DeviceKeyRecord, VaultRecord } from '@/types/vault'
import type { EyeBreakLogEntry, ScreenTimeDay } from '@/types/wellbeing'

export const DATABASE_NAME = 'taskuda'

export type TaskudaDatabase = Dexie & {
  tasks: EntityTable<Task, 'id'>
  companies: EntityTable<Company, 'id'>
  closeouts: EntityTable<Closeout, 'dayKey'>
  activityLog: EntityTable<ActivityEvent, 'id'>
  settings: EntityTable<SettingRecord, 'key'>
  calendarMappings: EntityTable<CalendarMapping, 'taskId'>
  vault: EntityTable<VaultRecord, 'id'>
  deviceKeys: EntityTable<DeviceKeyRecord, 'id'>
  eyeBreakLog: EntityTable<EyeBreakLogEntry, 'id'>
  screenTime: EntityTable<ScreenTimeDay, 'dayKey'>
  recurringSeries: EntityTable<RecurringSeries, 'id'>
}

export const db = new Dexie(DATABASE_NAME) as TaskudaDatabase

// Add new versions below instead of editing old ones, so existing data migrates.
db.version(1).stores({
  tasks: 'id, dayKey, companyId, [dayKey+block], carriedFromTaskId',
  companies: 'id',
  closeouts: 'dayKey',
  activityLog: '++id, at, type, taskId, dayKey',
  settings: 'key',
  calendarMappings: 'taskId, &eventId',
})

// v2: encrypted secrets. `vault` goes into backups; `deviceKeys` never does.
db.version(2).stores({
  vault: 'id',
  deviceKeys: 'id',
})

// v3 (PRD FR28, FR29): the eye-break log for M4 and the daily time in Taskuda for M5. Both stay on
// this device: in-app time is per device by definition, and they change every minute, which would
// keep marking the backup as changed.
db.version(3).stores({
  eyeBreakLog: '++id, dayKey',
  screenTime: 'dayKey',
})

// v4 (PRD FR20): repeating series. Tasks get `seriesId` (null for every existing task) and an index
// to find a series' task on a day. Backed up (backup format version 2).
db.version(4)
  .stores({
    tasks: 'id, dayKey, companyId, [dayKey+block], carriedFromTaskId, [seriesId+dayKey]',
    recurringSeries: 'id',
  })
  .upgrade((tx) =>
    tx
      .table('tasks')
      .toCollection()
      .modify((task: { seriesId?: string | null }) => {
        task.seriesId ??= null
      }),
  )

// v5 (PRD FR30): optional due date and time on tasks, null for every existing task. No new index:
// at-risk states are worked out from the day's tasks already in memory. Backup format version 3.
db.version(5)
  .stores({})
  .upgrade((tx) =>
    tx
      .table('tasks')
      .toCollection()
      .modify((task: { dueDate?: string | null; dueTime?: string | null }) => {
        task.dueDate ??= null
        task.dueTime ??= null
      }),
  )
