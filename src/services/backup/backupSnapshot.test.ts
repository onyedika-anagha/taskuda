import { beforeEach, describe, expect, it } from 'vitest'
import { createVault, getSecret, getVaultStatus, setSecret } from '@/services/crypto/secretVault'
import { createCompany, listCompanies } from '@/services/db/companyRepository'
import { db } from '@/services/db/database'
import { getSetting, setSetting } from '@/services/db/settingsRepository'
import { createTask, listTasksForDay } from '@/services/db/taskRepository'
import { resetVaultState } from '@/test/resetVault'
import { BackupUnreadableError, createBackupFile, parseBackupFile, restoreBackupFile } from './backupSnapshot'
import { getDeviceId, getDeviceName } from './deviceInfo'

const DAY = '2026-10-19'

describe('backup snapshot', () => {
  beforeEach(resetVaultState)

  it('round-trips everything through JSON and replaces local data on restore', async () => {
    await createCompany({ name: 'Acme', colorId: 'teal' })
    await createTask({ title: 'Kept in backup', dayKey: DAY, block: 'morning' })
    await setSetting('voice.leadMinutes', 10)
    const backup = parseBackupFile(JSON.stringify(await createBackupFile(1000)))

    await createTask({ title: 'Added after backup', dayKey: DAY, block: 'evening' })
    await setSetting('voice.leadMinutes', 15)
    await restoreBackupFile(backup)

    expect((await listTasksForDay(DAY)).map((t) => t.title)).toEqual(['Kept in backup'])
    expect((await listCompanies()).map((c) => c.name)).toEqual(['Acme'])
    expect(await getSetting('voice.leadMinutes', 0)).toBe(10)
    expect(backup).toMatchObject({ format: 'taskuda-backup', version: 1, createdAt: 1000 })
  })

  it('never includes the device key, and keeps this device’s identity and Drive settings', async () => {
    await createVault('correct horse battery')
    const deviceId = await getDeviceId()
    await setSetting('drive.connected', true)
    const backup = await createBackupFile()

    expect(JSON.stringify(backup)).not.toContain('deviceWrappedKey')
    expect(backup.data.settings.map((s) => s.key)).not.toContain('device.id')
    expect(backup.data.settings.map((s) => s.key)).not.toContain('drive.connected')
    expect(backup.deviceId).toBe(deviceId)
    expect(backup.deviceName).toBe(getDeviceName())

    await setSetting('drive.connected', false)
    await restoreBackupFile({
      ...backup,
      data: { ...backup.data, settings: [{ key: 'drive.connected', value: true }] },
    })
    expect(await getSetting('drive.connected', null)).toBe(false)
    expect(await getDeviceId()).toBe(deviceId)
    expect(await db.deviceKeys.count()).toBe(1)
  })

  it('AC12.3 carries keys only in encrypted form, and they unlock on the same device', async () => {
    await createVault('correct horse battery')
    await setSecret('gemini', 'AIza-backup-secret')
    const backup = await createBackupFile()
    expect(JSON.stringify(backup)).not.toContain('AIza-backup-secret')

    const result = await restoreBackupFile(backup)
    expect(result.hasSecrets).toBe(true)
    expect(await getVaultStatus()).toBe('unlocked')
    expect(await getSecret('gemini')).toBe('AIza-backup-secret')
  })

  it('a backup from another device restores keys as locked', async () => {
    await createVault('correct horse battery')
    await setSecret('gemini', 'k')
    const backup = await createBackupFile()
    await db.deviceKeys.clear()
    await restoreBackupFile(backup)
    expect(await getVaultStatus()).toBe('locked')
  })

  it.each([
    'not json',
    '{}',
    JSON.stringify({ format: 'something-else', version: 1 }),
    JSON.stringify({ format: 'taskuda-backup', version: 2 }),
  ])('F8.6 rejects unreadable backups: %s', (text) => {
    expect(() => parseBackupFile(text)).toThrow(BackupUnreadableError)
  })

  it('a rejected backup changes nothing', async () => {
    await createTask({ title: 'Safe', dayKey: DAY, block: 'morning' })
    expect(() => parseBackupFile('{"format":"taskuda-backup"}')).toThrow(BackupUnreadableError)
    expect((await listTasksForDay(DAY)).map((t) => t.title)).toEqual(['Safe'])
  })

  it('names devices for the restore warning', () => {
    expect(
      getDeviceName('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/150 Safari/537.36'),
    ).toBe('Windows · Chrome')
    expect(getDeviceName('Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/150 Mobile Safari')).toBe(
      'Android · Chrome',
    )
  })
})
