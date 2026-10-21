import { create } from 'zustand'
import { readLocal, removeLocal, writeLocal } from '@/utils/safeStorage'

/** Per-device, so the interval and a pending snooze survive a reload. */
const LAST_PROMPT_KEY = 'taskuda.eyeBreak.lastPromptAt'
const SNOOZED_KEY = 'taskuda.eyeBreak.snoozedUntil'

function readTime(key: string): number | null {
  const value = Number(readLocal(key))
  return Number.isFinite(value) && value > 0 ? value : null
}

function writeTime(key: string, value: number | null): void {
  if (value === null) removeLocal(key)
  else writeLocal(key, String(value))
}

/** The prompt on screen. `logged` once its outcome is saved, so it's never logged twice. */
export interface OpenEyeBreak {
  missed: boolean
  logged: boolean
}

interface EyeBreakStoreState {
  lastPromptAt: number | null
  snoozedUntil: number | null
  /** When this tab opened Taskuda; prompts count from here at the earliest (PRD AC28.2). */
  openedAt: number
  open: OpenEyeBreak | null
  /** A prompt was shown or skipped at `at`: the next interval starts, and any snooze is used up. */
  prompted: (at: number) => void
  snooze: (until: number) => void
  setOpen: (open: OpenEyeBreak | null) => void
}

export const useEyeBreakStore = create<EyeBreakStoreState>((set) => ({
  lastPromptAt: readTime(LAST_PROMPT_KEY),
  snoozedUntil: readTime(SNOOZED_KEY),
  openedAt: Date.now(),
  open: null,
  prompted: (at) => {
    writeTime(LAST_PROMPT_KEY, at)
    writeTime(SNOOZED_KEY, null)
    set({ lastPromptAt: at, snoozedUntil: null })
  },
  snooze: (until) => {
    writeTime(SNOOZED_KEY, until)
    set({ snoozedUntil: until })
  },
  setOpen: (open) => set({ open }),
}))
