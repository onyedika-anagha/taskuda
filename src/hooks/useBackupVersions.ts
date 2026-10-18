import { useState } from 'react'
import { listBackupVersions, type BackupVersion } from '@/services/backup/driveBackup'
import { GoogleAuthError } from '@/services/google/googleAuth'

export type VersionsState =
  | { state: 'idle' }
  | { state: 'loading' }
  | { state: 'loaded'; versions: BackupVersion[] }
  | { state: 'failed'; message: string }

/** Loads the Drive backup list on demand (from a click, so Google may ask to sign in). */
export function useBackupVersions() {
  const [versions, setVersions] = useState<VersionsState>({ state: 'idle' })

  async function load() {
    setVersions({ state: 'loading' })
    try {
      setVersions({ state: 'loaded', versions: await listBackupVersions({ interactive: true }) })
    } catch (error) {
      const message =
        error instanceof GoogleAuthError && error.kind === 'popup-closed'
          ? 'Google sign-in was cancelled.'
          : 'Couldn’t load your backups from Google Drive. Check your connection and try again.'
      setVersions({ state: 'failed', message })
    }
  }

  return { versions, load, reset: () => setVersions({ state: 'idle' }) }
}
