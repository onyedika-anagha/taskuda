import { backupFileSchema, type BackupFile } from '@/schemas/backupFile'
import { lockVault } from '@/services/crypto/secretVault'
import { db } from '@/services/db/database'
import { getDeviceId, getDeviceName } from './deviceInfo'

/**
 * Settings that describe this device or its Google connection. They are never backed up
 * and survive a restore, so restoring doesn't disconnect Drive or change the device's identity.
 */
export const LOCAL_ONLY_SETTING_PREFIXES = ['device.', 'drive.', 'google.'] as const

export function isLocalOnlySetting(key: string): boolean {
  return LOCAL_ONLY_SETTING_PREFIXES.some((prefix) => key.startsWith(prefix))
}

/** Tables copied into a backup. `deviceKeys` is deliberately absent: it must never leave the device. */
const BACKED_UP_TABLES = [
  db.tasks,
  db.companies,
  db.closeouts,
  db.activityLog,
  db.settings,
  db.calendarMappings,
  db.vault,
]

export class BackupUnreadableError extends Error {
  constructor() {
    super('This backup can’t be read. Try an older version.')
    this.name = 'BackupUnreadableError'
  }
}

export async function createBackupFile(now = Date.now()): Promise<BackupFile> {
  const deviceId = await getDeviceId()
  return db.transaction('r', BACKED_UP_TABLES, async () => {
    const [tasks, companies, closeouts, activityLog, settings, calendarMappings, vault] = await Promise.all([
      db.tasks.toArray(),
      db.companies.toArray(),
      db.closeouts.toArray(),
      db.activityLog.toArray(),
      db.settings.toArray(),
      db.calendarMappings.toArray(),
      db.vault.get('vault'),
    ])
    return {
      format: 'taskuda-backup',
      version: 1,
      createdAt: now,
      deviceId,
      deviceName: getDeviceName(),
      data: {
        tasks,
        companies,
        closeouts,
        activityLog,
        settings: settings.filter((s) => !isLocalOnlySetting(s.key)),
        calendarMappings,
        vault: vault ?? null,
      },
    } satisfies BackupFile
  })
}

/** Validates untrusted JSON (from Drive or a file) before anything is restored. */
export function parseBackupFile(text: string): BackupFile {
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    throw new BackupUnreadableError()
  }
  const result = backupFileSchema.safeParse(json)
  if (!result.success) throw new BackupUnreadableError()
  // Validated above; unknown extra fields are kept so newer backups keep their data.
  return result.data as unknown as BackupFile
}

export interface RestoreResult {
  /** The backup holds encrypted keys; they may need the passphrase on this device. */
  hasSecrets: boolean
}

/** Replaces everything on this device with the backup, in one transaction (design D4). */
export async function restoreBackupFile(file: BackupFile): Promise<RestoreResult> {
  const { data } = file
  await db.transaction('rw', BACKED_UP_TABLES, async () => {
    const localOnly = (await db.settings.toArray()).filter((s) => isLocalOnlySetting(s.key))
    await Promise.all(BACKED_UP_TABLES.map((table) => table.clear()))
    await db.tasks.bulkAdd(data.tasks)
    await db.companies.bulkAdd(data.companies)
    await db.closeouts.bulkAdd(data.closeouts)
    await db.activityLog.bulkAdd(data.activityLog)
    const restoredSettings = data.settings.filter((s) => !isLocalOnlySetting(s.key))
    await db.settings.bulkAdd([...restoredSettings, ...localOnly])
    await db.calendarMappings.bulkAdd(data.calendarMappings)
    if (data.vault) await db.vault.put(data.vault)
  })
  // The restored vault may not match this device's key; check again on next use.
  lockVault()
  return { hasSecrets: !!data.vault && Object.keys(data.vault.secrets).length > 0 }
}
