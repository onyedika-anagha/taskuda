import { useState } from 'react'
import { useWorkdaySettings } from '@/hooks/useWorkdaySettings'
import { setCloseoutReminder, setWorkingDays } from '@/services/workday/workdaySettings'
import { DEFAULT_CLOSEOUT_REMINDER, type Weekday } from '@/types/workday'
import { isValidTime } from '@/utils/timeBlocks'

interface Draft {
  workingDays: Weekday[]
  /** `null` is Off. */
  reminder: string | null
}

/**
 * S1b step 2 (PRD AC34.3): working days and the close-out reminder, saved together on Continue.
 * Starts from what's saved (the defaults on a fresh device), so a resumed setup keeps earlier choices.
 */
export function useSetupWorkday() {
  const saved = useWorkdaySettings()
  const [draft, setDraft] = useState<Draft | null>(null)
  const current: Draft | null =
    draft ?? (saved ? { workingDays: saved.workingDays, reminder: saved.closeoutReminder } : null)

  return {
    draft: current,
    setWorkingDays: (workingDays: Weekday[]) => current && setDraft({ ...current, workingDays }),
    setReminderOn: (on: boolean) =>
      current && setDraft({ ...current, reminder: on ? DEFAULT_CLOSEOUT_REMINDER : null }),
    setReminderTime: (time: string) => {
      if (current && isValidTime(time)) setDraft({ ...current, reminder: time })
    },
    async save(): Promise<void> {
      if (!current) return
      await setWorkingDays(current.workingDays)
      await setCloseoutReminder(current.reminder)
    },
  }
}
