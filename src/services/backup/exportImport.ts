import { format } from 'date-fns'
import type { BackupFile } from '@/schemas/backupFile'
import { createBackupFile, parseBackupFile } from './backupSnapshot'

/** CR2: the same format as Drive backups, saved as a file the user keeps. */
export async function exportBackup(now = Date.now()): Promise<{ filename: string; text: string }> {
  const file = await createBackupFile(now)
  return { filename: `taskuda-backup-${format(now, 'yyyy-MM-dd')}.json`, text: JSON.stringify(file, null, 2) }
}

/** Triggers a browser download of `text`. */
export function downloadTextFile(filename: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Reads and validates a chosen file; throws `BackupUnreadableError` for anything that isn't a Taskuda backup. */
export async function readBackupFromFile(file: File): Promise<BackupFile> {
  return parseBackupFile(await file.text())
}
