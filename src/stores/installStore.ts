import { create } from 'zustand'
import { readLocal, writeLocal } from '@/utils/safeStorage'

/** Chromium's install event (not in the TS DOM library yet). */
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISSED_KEY = 'taskuda.installPromptDismissedAt'
/** "Not now" hides the prompt for 30 days (design F13.2). */
export const INSTALL_SNOOZE_MS = 30 * 24 * 60 * 60 * 1000

interface InstallState {
  /** Set when the browser offers installation. */
  event: BeforeInstallPromptEvent | null
  installed: boolean
  install: () => Promise<void>
  dismiss: (now?: number) => void
}

export const useInstallStore = create<InstallState>((set, get) => ({
  event: null,
  installed: false,
  install: async () => {
    const { event } = get()
    if (!event) return
    await event.prompt()
    const { outcome } = await event.userChoice
    set({ event: null, installed: outcome === 'accepted' })
  },
  dismiss: (now = Date.now()) => {
    writeLocal(DISMISSED_KEY, String(now))
    set({ event: get().event })
  },
}))

export function isInstallSnoozed(now = Date.now()): boolean {
  const dismissedAt = Number(readLocal(DISMISSED_KEY))
  return !!dismissedAt && now - dismissedAt < INSTALL_SNOOZE_MS
}

/** Call once at startup: the browser fires the install event early and only once. */
export function listenForInstallPrompt(): void {
  window.addEventListener('beforeinstallprompt', (event) => {
    // Show our own prompt instead of the browser's mini-infobar.
    event.preventDefault()
    useInstallStore.setState({ event: event as BeforeInstallPromptEvent })
  })
  window.addEventListener('appinstalled', () => useInstallStore.setState({ event: null, installed: true }))
}
