import { setSetting } from '@/services/db/settingsRepository'
import {
  createAppDataFile,
  deleteAppDataFile,
  downloadAppDataFile,
  listAppDataFiles,
} from '@/services/google/driveAppData'
import type { BackupFile } from '@/schemas/backupFile'
import { createBackupFile, parseBackupFile } from './backupSnapshot'
import { getDeviceId } from './deviceInfo'

export const BACKUP_PREFIX = 'taskuda-backup-'
/** PRD RK7: keep previous versions so a bad backup can't overwrite the only good one. */
export const MAX_BACKUP_VERSIONS = 10
export const LAST_BACKUP_KEY = 'drive.lastBackupAt'

export interface BackupVersion {
  id: string
  createdAt: number
  deviceName: string
  fromThisDevice: boolean
}

type Interactive = { interactive?: boolean }

/** Uploads a new backup version, then deletes versions beyond the newest 10. */
export async function backupToDrive(options: Interactive = {}, now = Date.now()): Promise<number> {
  const file = await createBackupFile(now)
  await createAppDataFile(
    `${BACKUP_PREFIX}${new Date(now).toISOString().replace(/[:.]/g, '-')}.json`,
    JSON.stringify(file),
    {
      deviceId: file.deviceId,
      deviceName: file.deviceName,
      createdAt: String(now),
      version: String(file.version),
    },
    options,
  )
  const versions = await listAppDataFiles(BACKUP_PREFIX)
  await Promise.all(versions.slice(MAX_BACKUP_VERSIONS).map((v) => deleteAppDataFile(v.id)))
  await setSetting(LAST_BACKUP_KEY, now)
  return now
}

/** Newest first. */
export async function listBackupVersions(options: Interactive = {}): Promise<BackupVersion[]> {
  const [files, deviceId] = await Promise.all([listAppDataFiles(BACKUP_PREFIX, options), getDeviceId()])
  return files
    .map((f) => ({
      id: f.id,
      createdAt: Number(f.appProperties?.createdAt) || Date.parse(f.createdTime),
      deviceName: f.appProperties?.deviceName || 'Unknown device',
      fromThisDevice: f.appProperties?.deviceId === deviceId,
    }))
    .sort((a, b) => b.createdAt - a.createdAt)
}

/** Downloads and validates one version; throws `BackupUnreadableError` if it can't be used. */
export async function downloadBackup(id: string): Promise<BackupFile> {
  return parseBackupFile(await downloadAppDataFile(id))
}
