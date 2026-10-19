import { useEffect, useRef } from 'react'
import { dueReminders, planReminders } from '@/services/reminders/reminderPlan'
import { listTasksForDay } from '@/services/db/taskRepository'
import { voiceAlert } from '@/services/voice/voiceAlerts'
import { getVoiceSettings } from '@/services/voice/voiceSettings'
import { loadHandled, useReminderStore } from '@/stores/reminderStore'
import { todayKey } from '@/utils/dates'

/** Checked this often; browsers slow timers in background tabs anyway, so exact timers don't help. */
export const REMINDER_TICK_MS = 15_000

/** One check: speak/show what's due now, list what was missed (PRD AC9.1, AC9.2, AC9.5). */
export async function checkReminders(now = Date.now(), visible = document.visibilityState === 'visible') {
  const dayKey = todayKey(new Date(now))
  const [tasks, settings] = await Promise.all([listTasksForDay(dayKey), getVoiceSettings()])
  const reminders = planReminders(tasks, settings.leadMinutes)
  const due = dueReminders(reminders, new Map(tasks.map((t) => [t.id, t])), loadHandled(dayKey), now, visible)
  const store = useReminderStore.getState()
  // Everything due is handled now, including "Up next" alerts superseded by "Starting now".
  const handledNow = reminders.filter((r) => r.at <= now)
  store.markHandled(dayKey, handledNow)
  if (due.missed.length) store.addMissed(due.missed)
  for (const reminder of due.onTime) await voiceAlert(reminder.text)
}

/** Runs reminder checks while the app is open, and right away when it comes back to the foreground. */
export function useReminderTicks(): void {
  const running = useRef(false)

  useEffect(() => {
    const tick = () => {
      if (running.current) return
      running.current = true
      void checkReminders().finally(() => {
        running.current = false
      })
    }
    tick()
    const interval = setInterval(tick, REMINDER_TICK_MS)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [])
}
