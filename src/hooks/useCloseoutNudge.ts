import { useLiveQuery } from 'dexie-react-hooks'
import { useNow } from '@/hooks/useNow'
import { getCloseout } from '@/services/db/closeoutRepository'
import { isNudgeDue, nudgeText } from '@/services/workday/closeoutNudge'
import { getCloseoutReminder, getWorkingDays } from '@/services/workday/workdaySettings'
import { useCloseoutNudgeStore } from '@/stores/closeoutNudgeStore'
import { toDayKey } from '@/utils/dates'

export interface CloseoutNudge {
  message: string
  dayKey: string
  dismiss: () => void
}

/** The nudge banner on S2 (PRD FR21), or `null` when it shouldn't show. */
export function useCloseoutNudge(): CloseoutNudge | null {
  const now = new Date(useNow(15_000))
  const today = toDayKey(now)
  const dismissedDay = useCloseoutNudgeStore((s) => s.dismissedDay)
  const dismiss = useCloseoutNudgeStore((s) => s.dismiss)
  const data = useLiveQuery(
    async () => {
      const [reminderTime, workingDays, closeout] = await Promise.all([
        getCloseoutReminder(),
        getWorkingDays(),
        getCloseout(today),
      ])
      return { reminderTime, workingDays, closedToday: !!closeout }
    },
    [today],
  )
  if (!data?.reminderTime) return null
  if (!isNudgeDue({ now, dismissedDay, ...data })) return null
  return { message: nudgeText(data.reminderTime).message, dayKey: today, dismiss: () => dismiss(today) }
}
