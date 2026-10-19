import { create } from 'zustand'
import { backupToDrive, LAST_BACKUP_KEY } from '@/services/backup/driveBackup'
import { getSetting, setSetting } from '@/services/db/settingsRepository'
import { GoogleApiError } from '@/services/google/googleApi'
import {
  DRIVE_APPDATA_SCOPE,
  GoogleAuthError,
  getAccessToken,
  revokeGoogleAccess,
} from '@/services/google/googleAuth'

export const DRIVE_CONNECTED_KEY = 'drive.connected'
/** AC7.1 asks for a backup within 1 minute of a change; wait a bit so bursts of edits make one backup. */
export const BACKUP_DEBOUNCE_MS = 20_000

export type BackupStatus =
  | { state: 'loading' }
  | { state: 'not-connected' }
  | { state: 'idle'; lastBackupAt: number | null }
  | { state: 'backing-up' }
  | { state: 'offline' }
  /** Google needs a click (token expired and silent renewal wasn't possible). */
  | { state: 'reconnect' }
  | { state: 'failed'; reason: string }

interface BackupState {
  status: BackupStatus
  connected: boolean
  init: () => Promise<void>
  /** From a click: may open Google's consent popup. */
  /** `backupNow: false` (first run): connect first, so an existing backup can be found before ours replaces it as newest. */
  connect: (options?: { backupNow?: boolean }) => Promise<void>
  disconnect: () => Promise<void>
  backupNow: (options?: { interactive?: boolean }) => Promise<void>
  /** Called after local changes; backs up after a short pause when connected and online. */
  scheduleBackup: () => void
}

let timer: ReturnType<typeof setTimeout> | undefined
let pending = false

function failureReason(error: unknown): string {
  if (error instanceof GoogleApiError) {
    if (error.kind === 'quota') return 'Google Drive is busy or your storage is full'
    if (error.kind === 'network') return 'the connection failed'
    return 'Google Drive returned an error'
  }
  if (error instanceof GoogleAuthError && error.kind === 'not-configured') {
    return 'Google sign-in isn’t set up for this copy of Taskuda'
  }
  return 'something unexpected happened'
}

export const useBackupStore = create<BackupState>((set, get) => ({
  status: { state: 'loading' },
  connected: false,

  init: async () => {
    const [connected, lastBackupAt] = await Promise.all([
      getSetting(DRIVE_CONNECTED_KEY, false),
      getSetting<number | null>(LAST_BACKUP_KEY, null),
    ])
    set({ connected, status: connected ? { state: 'idle', lastBackupAt } : { state: 'not-connected' } })
  },

  connect: async ({ backupNow = true } = {}) => {
    await getAccessToken([DRIVE_APPDATA_SCOPE], { interactive: true })
    await setSetting(DRIVE_CONNECTED_KEY, true)
    const lastBackupAt = await getSetting<number | null>(LAST_BACKUP_KEY, null)
    set({ connected: true, status: { state: 'idle', lastBackupAt } })
    if (backupNow) await get().backupNow()
  },

  disconnect: async () => {
    clearTimeout(timer)
    pending = false
    await revokeGoogleAccess()
    await setSetting(DRIVE_CONNECTED_KEY, false)
    set({ connected: false, status: { state: 'not-connected' } })
  },

  backupNow: async ({ interactive = false } = {}) => {
    if (!get().connected) return
    clearTimeout(timer)
    if (!navigator.onLine) {
      pending = true
      set({ status: { state: 'offline' } })
      return
    }
    pending = false
    set({ status: { state: 'backing-up' } })
    try {
      const lastBackupAt = await backupToDrive({ interactive })
      set({ status: { state: 'idle', lastBackupAt } })
    } catch (error) {
      pending = true
      const needsClick =
        (error instanceof GoogleAuthError &&
          ['interaction-required', 'popup-closed', 'denied'].includes(error.kind)) ||
        (error instanceof GoogleApiError && error.kind === 'auth-expired')
      set({ status: needsClick ? { state: 'reconnect' } : { state: 'failed', reason: failureReason(error) } })
    }
  },

  scheduleBackup: () => {
    if (!get().connected) return
    pending = true
    clearTimeout(timer)
    timer = setTimeout(() => void get().backupNow(), BACKUP_DEBOUNCE_MS)
  },
}))

/** Back online with unsaved changes: back up right away. */
export function backupIfPending(): void {
  if (pending) void useBackupStore.getState().backupNow()
}
