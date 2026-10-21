import { format } from 'date-fns'
import { createElement, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { ReminderToast } from '@/components/reminders/ReminderToast'
import { checkCloseoutNudge } from '@/services/workday/closeoutNudgeAlerts'
import { ON_TIME_TOLERANCE_MS, dueReminders, planReminders } from '@/services/reminders/reminderPlan'
import { getTask, listTasksForDay } from '@/services/db/taskRepository'
import { changeTaskStatus } from '@/services/tasks/taskStatusActions'
import { speakAlert } from '@/services/voice/voiceAlerts'
import { getVoiceSettings } from '@/services/voice/voiceSettings'
import { loadHandled, useReminderStore } from '@/stores/reminderStore'
import type { Reminder, SnoozeMinutes } from '@/types/voice'
import { todayKey } from '@/utils/dates'

/** Checked this often; browsers slow timers in background tabs anyway, so exact timers don't help. */
export const REMINDER_TICK_MS = 15_000

/** One toast per task: "Starting now" replaces "Up next", and a snoozed reminder replaces itself. */
const toastId = (reminder: Reminder) => `reminder:${reminder.taskId}`

function snooze(reminder: Reminder, minutes: SnoozeMinutes): void {
  const at = Date.now() + minutes * 60_000
  useReminderStore.getState().snooze(todayKey(new Date(at)), { ...reminder, at })
  toast(`Reminder snoozed until ${format(at, 'h:mm a')}.`)
}

async function markDone(reminder: Reminder): Promise<void> {
  const task = await getTask(reminder.taskId)
  if (task) await changeTaskStatus(task, 'done')
}

/** Toast with Snooze 5 min, Snooze 15 min and Mark done, until the user acts (PRD AC22.1, AC22.4). */
function showReminderToast(reminder: Reminder): void {
  const id = toastId(reminder)
  const close = () => toast.dismiss(id)
  toast.custom(
    () =>
      createElement(ReminderToast, {
        text: reminder.text,
        onClose: close,
        onSnooze: (minutes) => {
          close()
          snooze(reminder, minutes)
        },
        onDone: () => {
          close()
          void markDone(reminder)
        },
      }),
    { id, duration: Infinity },
  )
}

async function alertReminder(reminder: Reminder): Promise<void> {
  showReminderToast(reminder)
  await speakAlert(reminder.text)
}

/** Snoozed reminders that are due again; ones for tasks done since then are dropped (AC22.2). */
async function dueSnoozes(dayKey: string, now: number): Promise<Reminder[]> {
  const due = useReminderStore.getState().takeDueSnoozes(dayKey, now)
  const live = await Promise.all(due.map(async (r) => ((await getTask(r.taskId))?.status === 'done' ? null : r)))
  return live.filter((r): r is Reminder => r !== null)
}

/** One check: speak/show what's due now, list what was missed (PRD AC9.1, AC9.2, AC9.5, AC22.2). */
export async function checkReminders(now = Date.now(), visible = document.visibilityState === 'visible') {
  const dayKey = todayKey(new Date(now))
  const [tasks, settings] = await Promise.all([listTasksForDay(dayKey), getVoiceSettings()])
  const reminders = planReminders(tasks, settings.leadMinutes)
  const due = dueReminders(reminders, new Map(tasks.map((t) => [t.id, t])), loadHandled(dayKey), now, visible)
  const store = useReminderStore.getState()
  // Everything due is handled now, including "Up next" alerts superseded by "Starting now".
  const handledNow = reminders.filter((r) => r.at <= now)
  store.markHandled(dayKey, handledNow)

  for (const snoozed of await dueSnoozes(dayKey, now)) {
    if (visible && now - snoozed.at <= ON_TIME_TOLERANCE_MS) due.onTime.push(snoozed)
    else due.missed.push(snoozed)
  }
  if (due.missed.length) store.addMissed(due.missed)
  for (const reminder of due.onTime) await alertReminder(reminder)
  await checkCloseoutNudge(new Date(now), visible)
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
