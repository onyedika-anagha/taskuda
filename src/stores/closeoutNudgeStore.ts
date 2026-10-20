import { create } from 'zustand'
import { readLocal, writeLocal } from '@/utils/safeStorage'

/** Per-device conveniences: which day the nudge was dismissed on, and which day it already alerted. */
const DISMISSED_KEY = 'taskuda.closeoutNudge.dismissed'
const ALERTED_KEY = 'taskuda.closeoutNudge.alerted'

export function loadAlertedDay(): string | null {
  return readLocal(ALERTED_KEY)
}

export function saveAlertedDay(dayKey: string): void {
  writeLocal(ALERTED_KEY, dayKey)
}

interface CloseoutNudgeState {
  dismissedDay: string | null
  /** "Not today": hidden until the next working day (PRD AC21.3). */
  dismiss: (dayKey: string) => void
}

export const useCloseoutNudgeStore = create<CloseoutNudgeState>((set) => ({
  dismissedDay: readLocal(DISMISSED_KEY),
  dismiss: (dayKey) => {
    writeLocal(DISMISSED_KEY, dayKey)
    set({ dismissedDay: dayKey })
  },
}))
