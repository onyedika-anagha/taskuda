import { create } from 'zustand'
import { readLocal, writeLocal } from '@/utils/safeStorage'

/** Per-device, per-day marks: the last budget level warned about, and the last one dismissed. */
const WARNED_KEY = 'taskuda.budget.warned'
const DISMISSED_KEY = 'taskuda.budget.dismissed'

export interface DayLevel {
  dayKey: string
  level: number
}

function readDayLevel(key: string): DayLevel | null {
  try {
    const value = JSON.parse(readLocal(key) ?? 'null') as Partial<DayLevel> | null
    return value && typeof value.dayKey === 'string' && typeof value.level === 'number'
      ? { dayKey: value.dayKey, level: value.level }
      : null
  } catch {
    return null
  }
}

/** The level for `dayKey`, or `null` when the mark is from another day. */
export function levelOn(mark: DayLevel | null, dayKey: string): number | null {
  return mark?.dayKey === dayKey ? mark.level : null
}

interface BudgetState {
  warned: DayLevel | null
  dismissed: DayLevel | null
  markWarned: (mark: DayLevel) => void
  dismiss: (mark: DayLevel) => void
}

export const useBudgetStore = create<BudgetState>((set) => ({
  warned: readDayLevel(WARNED_KEY),
  dismissed: readDayLevel(DISMISSED_KEY),
  markWarned: (mark) => {
    writeLocal(WARNED_KEY, JSON.stringify(mark))
    set({ warned: mark })
  },
  dismiss: (mark) => {
    writeLocal(DISMISSED_KEY, JSON.stringify(mark))
    set({ dismissed: mark })
  },
}))
