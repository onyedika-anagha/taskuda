/** Minutes before a task's start time for the "Up next" reminder; 0 means off (design S7e). */
export const LEAD_MINUTE_OPTIONS = [0, 5, 10, 15] as const
export type LeadMinutes = (typeof LEAD_MINUTE_OPTIONS)[number]

export interface VoiceSettings {
  /** Spoken alerts on/off (PRD AC9.3). Toasts for reminders still show when off. */
  enabled: boolean
  leadMinutes: LeadMinutes
  /** `SpeechSynthesisVoice.voiceURI`; `null` uses the browser's default voice. */
  voiceURI: string | null
}

export type ReminderKind = 'upcoming' | 'start'

export interface Reminder {
  /** Stable per task, kind and time, so a moved task gets a fresh reminder. */
  id: string
  taskId: string
  kind: ReminderKind
  /** When it's due (ms). */
  at: number
  /** What's spoken and shown (design spec Section 8, Voice lines). */
  text: string
}
