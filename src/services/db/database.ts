import { Dexie, type EntityTable } from 'dexie'
import type { ActivityEvent } from '@/types/activity'
import type { CalendarMapping } from '@/types/calendar'
import type { Closeout } from '@/types/closeout'
import type { Company } from '@/types/company'
import type { SettingRecord } from '@/types/settings'
import type { Task } from '@/types/task'

export const DATABASE_NAME = 'taskuda'

export type TaskudaDatabase = Dexie & {
  tasks: EntityTable<Task, 'id'>
  companies: EntityTable<Company, 'id'>
  closeouts: EntityTable<Closeout, 'dayKey'>
  activityLog: EntityTable<ActivityEvent, 'id'>
  settings: EntityTable<SettingRecord, 'key'>
  calendarMappings: EntityTable<CalendarMapping, 'taskId'>
}

export const db = new Dexie(DATABASE_NAME) as TaskudaDatabase

// Add new versions below instead of editing this one, so existing data migrates.
db.version(1).stores({
  tasks: 'id, dayKey, companyId, [dayKey+block], carriedFromTaskId',
  companies: 'id',
  closeouts: 'dayKey',
  activityLog: '++id, at, type, taskId, dayKey',
  settings: 'key',
  calendarMappings: 'taskId, &eventId',
})
