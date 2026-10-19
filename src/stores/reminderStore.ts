import { create } from 'zustand'
import type { Reminder } from '@/types/voice'
import { readLocal, writeLocal } from '@/utils/safeStorage'

const handledKey = (dayKey: string) => `taskuda.remindersHandled.${dayKey}`

/** Reminders already spoken or listed today, so a reload doesn't repeat them (a per-device convenience). */
export function loadHandled(dayKey: string): Set<string> {
  try {
    return new Set(JSON.parse(readLocal(handledKey(dayKey)) ?? '[]') as string[])
  } catch {
    return new Set()
  }
}

function saveHandled(dayKey: string, handled: Set<string>): void {
  writeLocal(handledKey(dayKey), JSON.stringify([...handled]))
}

interface ReminderState {
  /** Shown in the catch-up panel until dismissed (design F11.2). */
  missed: Reminder[]
  markHandled: (dayKey: string, reminders: Reminder[]) => void
  addMissed: (reminders: Reminder[]) => void
  dismissMissed: () => void
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
}))
