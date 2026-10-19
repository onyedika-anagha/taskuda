import { getSetting, setSetting } from '@/services/db/settingsRepository'
import { LEAD_MINUTE_OPTIONS, type LeadMinutes, type VoiceSettings } from '@/types/voice'

/** `device.` keeps these on this device: voices differ between devices (and aren't backed up). */
const KEYS = {
  enabled: 'device.voice.enabled',
  leadMinutes: 'device.voice.leadMinutes',
  voiceURI: 'device.voice.voiceURI',
} as const

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = { enabled: true, leadMinutes: 5, voiceURI: null }

export async function getVoiceSettings(): Promise<VoiceSettings> {
  const [enabled, leadMinutes, voiceURI] = await Promise.all([
    getSetting(KEYS.enabled, DEFAULT_VOICE_SETTINGS.enabled),
    getSetting<number>(KEYS.leadMinutes, DEFAULT_VOICE_SETTINGS.leadMinutes),
    getSetting<string | null>(KEYS.voiceURI, DEFAULT_VOICE_SETTINGS.voiceURI),
  ])
  const lead = (LEAD_MINUTE_OPTIONS as readonly number[]).includes(leadMinutes)
    ? (leadMinutes as LeadMinutes)
    : DEFAULT_VOICE_SETTINGS.leadMinutes
  return { enabled, leadMinutes: lead, voiceURI }
}

export const setVoiceEnabled = (enabled: boolean) => setSetting(KEYS.enabled, enabled)
export const setLeadMinutes = (minutes: LeadMinutes) => setSetting(KEYS.leadMinutes, minutes)
export const setVoiceURI = (voiceURI: string | null) => setSetting(KEYS.voiceURI, voiceURI)
