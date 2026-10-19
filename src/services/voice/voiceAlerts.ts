import { toast } from 'sonner'
import { pickCheer } from '@/services/reminders/reminderPlan'
import { getVoiceSettings } from './voiceSettings'
import { speak } from './speechService'

/**
 * Shows `text` as a toast and, with voice on, speaks it. Every spoken alert has an on-screen
 * twin (design spec Section 7, DAC12), and on browsers that can't speak the toast still shows.
 */
export async function voiceAlert(text: string, options: { onlyWithVoice?: boolean } = {}): Promise<void> {
  const settings = await getVoiceSettings()
  if (options.onlyWithVoice && !settings.enabled) return
  toast(text)
  if (settings.enabled) speak(text, settings.voiceURI)
}

/** Completion cheer (PRD AC9.2), only with voice on. */
export function cheer(): Promise<void> {
  return voiceAlert(pickCheer(), { onlyWithVoice: true })
}
