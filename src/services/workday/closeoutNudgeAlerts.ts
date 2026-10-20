import { toast } from 'sonner'
import { getCloseout } from '@/services/db/closeoutRepository'
import { speakAlert } from '@/services/voice/voiceAlerts'
import { loadAlertedDay, saveAlertedDay, useCloseoutNudgeStore } from '@/stores/closeoutNudgeStore'
import { toDayKey } from '@/utils/dates'
import { isNudgeDue, nudgeText, shouldAlertNudge, type NudgeState } from './closeoutNudge'
import { getCloseoutReminder, getWorkingDays } from './workdaySettings'

/**
 * Runs with each reminder check: the first check past the nudge time marks the day as alerted, and
 * shows the toast and speaks only if Taskuda was open at that time (PRD AC21.2–AC21.4).
 * The banner itself comes from `useCloseoutNudge`.
 */
export async function checkCloseoutNudge(now: Date, visible: boolean): Promise<void> {
  const today = toDayKey(now)
  const [reminderTime, workingDays, closeout] = await Promise.all([
    getCloseoutReminder(),
    getWorkingDays(),
    getCloseout(today),
  ])
  const state: NudgeState = {
    now,
    reminderTime,
    workingDays,
    closedToday: !!closeout,
    dismissedDay: useCloseoutNudgeStore.getState().dismissedDay,
  }
  const alertedDay = loadAlertedDay()
  if (!isNudgeDue(state) || alertedDay === today) return

  const alert = shouldAlertNudge(state, alertedDay, visible)
  saveAlertedDay(today)
  if (!alert || !reminderTime) return
  const text = nudgeText(reminderTime)
  toast(text.message)
  await speakAlert(text.voice)
}
