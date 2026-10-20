import { toast } from 'sonner'
import { pickCheer } from '@/services/reminders/reminderPlan'
import { getQuietHours } from '@/services/workday/workdaySettings'
import { isInQuietHours } from '@/utils/quietHours'
import { getVoiceSettings } from './voiceSettings'
import { speak } from './speechService'

/** Voice is on and it isn't quiet hours (PRD AC9.3, AC23.2). */
async function canSpeak(now = new Date()): Promise<{ allowed: boolean; voiceURI: string | null }> {
  const [settings, quietHours] = await Promise.all([getVoiceSettings(), getQuietHours()])
  return { allowed: settings.enabled && !isInQuietHours(now, quietHours), voiceURI: settings.voiceURI }
}

/** Speaks `text` when voice is on and it isn't quiet hours. The caller shows the on-screen twin. */
export async function speakAlert(text: string): Promise<boolean> {
  const { allowed, voiceURI } = await canSpeak()
  if (allowed) speak(text, voiceURI)
  return allowed
}

/**
 * Shows `text` as a toast and, with voice on outside quiet hours, speaks it. Every spoken alert has
 * an on-screen twin (design spec Section 7, DAC12), and on browsers that can't speak the toast still
 * shows.
 */
export async function voiceAlert(text: string, options: { onlyWithVoice?: boolean } = {}): Promise<void> {
  const { allowed, voiceURI } = await canSpeak()
  if (options.onlyWithVoice && !allowed) return
  toast(text)
  if (allowed) speak(text, voiceURI)
}

/** Completion cheer (PRD AC9.2), only when it can be spoken. */
export function cheer(): Promise<void> {
  return voiceAlert(pickCheer(), { onlyWithVoice: true })
}
