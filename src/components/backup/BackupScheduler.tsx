import { useEffect } from 'react'
import { trackBackedUpChanges } from '@/services/backup/changeTracking'
import { backupIfPending, useBackupStore } from '@/stores/backupStore'

/** Starts automatic Drive backups (PRD FR7, AC7.1). Renders nothing; mount once. */
export function BackupScheduler() {
  const init = useBackupStore((s) => s.init)
  const scheduleBackup = useBackupStore((s) => s.scheduleBackup)

  useEffect(() => {
    void init()
    const stop = trackBackedUpChanges(scheduleBackup)
    window.addEventListener('online', backupIfPending)
    return () => {
      stop()
      window.removeEventListener('online', backupIfPending)
    }
  }, [init, scheduleBackup])

  return null
}
