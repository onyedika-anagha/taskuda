import { create } from 'zustand'
import type { Reminder } from '@/types/voice'
import { readLocal, writeLocal } from '@/utils/safeStorage'

const handledKey = (dayKey: string) => `taskuda.remindersHandled.${dayKey}`
const snoozedKey = (dayKey: string) => `taskuda.remindersSnoozed.${dayKey}`

function readList<T>(key: string, fallback: T): T {
  try {
    return (JSON.parse(readLocal(key) ?? 'null') as T | null) ?? fallback
  } catch {
    return fallback
  }
}

/** Reminders already spoken or listed today, so a reload doesn't repeat them (a per-device convenience). */
export function loadHandled(dayKey: string): Set<string> {
  return new Set(readList<string[]>(handledKey(dayKey), []))
}

function saveHandled(dayKey: string, handled: Set<string>): void {
  writeLocal(handledKey(dayKey), JSON.stringify([...handled]))
}

/** Snoozed reminders, each with its new time (PRD AC22.2). Kept across a reload, like `handled`. */
export function loadSnoozed(dayKey: string): Reminder[] {
  return readList<Reminder[]>(snoozedKey(dayKey), [])
}

function saveSnoozed(dayKey: string, snoozed: Reminder[]): void {
  writeLocal(snoozedKey(dayKey), JSON.stringify(snoozed))
}

interface ReminderState {
  /** Shown in the catch-up panel until dismissed (design F11.2). */
  missed: Reminder[]
  markHandled: (dayKey: string, reminders: Reminder[]) => void
  addMissed: (reminders: Reminder[]) => void
  dismissMissed: () => void
  /** Replaces any earlier snooze of the same reminder. */
  snooze: (dayKey: string, reminder: Reminder) => void
  /** Takes snoozed reminders that are due off the list. */
  takeDueSnoozes: (dayKey: string, now: number) => Reminder[]
}

export const useReminderStore = create<ReminderState>((set) => ({
  missed: [],
  markHandled: (dayKey, reminders) => {
    const handled = loadHandled(dayKey)
    for (const r of reminders) handled.add(r.id)
    saveHandled(dayKey, handled)
  },
  addMissed: (reminders) =>
    set((state) => ({
      missed: [...state.missed, ...reminders.filter((r) => !state.missed.some((m) => m.id === r.id))],
    })),
  dismissMissed: () => set({ missed: [] }),
  snooze: (dayKey, reminder) => {
    saveSnoozed(dayKey, [...loadSnoozed(dayKey).filter((r) => r.id !== reminder.id), reminder])
  },
  takeDueSnoozes: (dayKey, now) => {
    const snoozed = loadSnoozed(dayKey)
    const due = snoozed.filter((r) => r.at <= now)
    if (due.length) saveSnoozed(dayKey, snoozed.filter((r) => r.at > now))
    return due
  },
}))
