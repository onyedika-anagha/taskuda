import { formatDistanceToNowStrict } from 'date-fns'
import type { BackupStatus } from '@/stores/backupStore'

/** Sync indicator copy (design spec Section 8). */
export function backupStatusText(status: BackupStatus, now = Date.now()): string {
  switch (status.state) {
    case 'loading':
    case 'not-connected':
      return 'Saved on this device'
    case 'backing-up':
      return 'Backing up…'
    case 'offline':
      return 'Offline'
    case 'reconnect':
      return 'Reconnect Google'
    case 'failed':
      return 'Backup failed'
    case 'idle':
      if (!status.lastBackupAt) return 'Not backed up yet'
      if (now - status.lastBackupAt < 60_000) return 'Backed up just now'
      return `Backed up ${formatDistanceToNowStrict(status.lastBackupAt, { roundingMethod: 'floor' })} ago`
  }
}
