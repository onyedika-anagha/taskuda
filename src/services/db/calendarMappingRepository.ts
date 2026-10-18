import type { CalendarMapping } from '@/types/calendar'
import { db } from './database'

export function getMappingForTask(taskId: string): Promise<CalendarMapping | undefined> {
  return db.calendarMappings.get(taskId)
}

export function getMappingForEvent(eventId: string): Promise<CalendarMapping | undefined> {
  return db.calendarMappings.where('eventId').equals(eventId).first()
}

export async function saveMapping(mapping: CalendarMapping): Promise<void> {
  await db.calendarMappings.put(mapping)
}

export async function deleteMappingForTask(taskId: string): Promise<void> {
  await db.calendarMappings.delete(taskId)
}

export function listMappings(): Promise<CalendarMapping[]> {
  return db.calendarMappings.toArray()
}
