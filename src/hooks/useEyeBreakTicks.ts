import { createElement, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { EyeBreakToast } from '@/components/reminders/EyeBreakToast'
import {
  EYE_BREAK_TOAST_ID,
  checkEyeBreak,
  eyeBreakText,
  settleEyeBreak,
  snoozeEyeBreak,
} from '@/services/eyeBreaks/eyeBreakAlerts'
import { REMINDER_TICK_MS } from './useReminderTicks'

/** Done · Snooze 5 min, until the user acts (design F15). Replaces any open eye-break toast. */
function showEyeBreakToast(missed: boolean): void {
  toast.custom(
    () =>
      createElement(EyeBreakToast, {
        text: eyeBreakText(missed),
        onDone: () => void settleEyeBreak('done'),
        onSnooze: () => void snoozeEyeBreak(),
        onClose: () => void settleEyeBreak('dismissed'),
      }),
    { id: EYE_BREAK_TOAST_ID, duration: Infinity },
  )
}

export function runEyeBreakCheck(now = Date.now(), visible = document.visibilityState === 'visible') {
  return checkEyeBreak(now, visible, showEyeBreakToast)
}

/** Checks for eye breaks while the app is open, and right away when it comes back (PRD FR28). */
export function useEyeBreakTicks(): void {
  const running = useRef(false)

  useEffect(() => {
    const tick = () => {
      if (running.current) return
      running.current = true
      void runEyeBreakCheck().finally(() => {
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
