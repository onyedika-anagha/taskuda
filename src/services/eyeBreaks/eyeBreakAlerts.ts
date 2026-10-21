import { toast } from 'sonner'
import { logEyeBreak } from '@/services/db/eyeBreakRepository'
import { speakAlert } from '@/services/voice/voiceAlerts'
import { getEyeBreaks, getQuietHours, getWorkingDays } from '@/services/workday/workdaySettings'
import { useEyeBreakStore } from '@/stores/eyeBreakStore'
import type { EyeBreakOutcome } from '@/types/wellbeing'
import { decideEyeBreak } from './eyeBreakPlan'

/** Only one eye-break toast at a time (design spec Section 5): a new one replaces the old. */
export const EYE_BREAK_TOAST_ID = 'eye-break'
export const EYE_BREAK_SNOOZE_MS = 5 * 60_000

const PROMPT_TEXT = 'Time for an eye break. Look at something far away for 20 seconds.'
const MISSED_SUFFIX = ' (missed while you were away)'
const VOICE_LINE = 'Time for an eye break.'

/** Toast text (design spec Section 8). */
export function eyeBreakText(missed: boolean): string {
  return missed ? PROMPT_TEXT + MISSED_SUFFIX : PROMPT_TEXT
}

/** Saves the open prompt's outcome once; a missed prompt was already logged when it was shown. */
export async function settleEyeBreak(outcome: EyeBreakOutcome): Promise<void> {
  const store = useEyeBreakStore.getState()
  const open = store.open
  store.setOpen(null)
  toast.dismiss(EYE_BREAK_TOAST_ID)
  if (open && !open.logged) await logEyeBreak(outcome)
}

/** Snooze 5 min: the prompt comes back then, and this one is logged as snoozed. */
export async function snoozeEyeBreak(now = Date.now()): Promise<void> {
  useEyeBreakStore.getState().snooze(now + EYE_BREAK_SNOOZE_MS)
  await settleEyeBreak('snoozed')
}

/**
 * One check (PRD FR28, design F15). `show` puts the prompt on screen; the caller owns the toast
 * markup, and the toast's buttons call `settleEyeBreak` or `snoozeEyeBreak`.
 */
export async function checkEyeBreak(
  now: number,
  visible: boolean,
  show: (missed: boolean) => void,
): Promise<void> {
  const [settings, workingDays, quietHours] = await Promise.all([
    getEyeBreaks(),
    getWorkingDays(),
    getQuietHours(),
  ])
  const store = useEyeBreakStore.getState()
  const decision = decideEyeBreak({
    now,
    settings,
    workingDays,
    quietHours,
    lastPromptAt: store.lastPromptAt,
    snoozedUntil: store.snoozedUntil,
    openedAt: store.openedAt,
    visible,
  })
  if (decision.type === 'wait') return
  store.prompted(now)
  if (decision.type === 'skip') return

  // A prompt still open when the next comes due is replaced and counts as missed (F15.5).
  if (store.open && !store.open.logged) await logEyeBreak('missed', now)
  if (decision.missed) await logEyeBreak('missed', now)
  store.setOpen({ missed: decision.missed, logged: decision.missed })
  show(decision.missed)
  if (!decision.missed) await speakAlert(VOICE_LINE)
}
