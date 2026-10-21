import { beforeEach, describe, expect, it } from 'vitest'
import { createVault, getSecret, getVaultStatus, setSecret } from '@/services/crypto/secretVault'
import { createCompany, listCompanies } from '@/services/db/companyRepository'
import { db } from '@/services/db/database'
import { getSetting, setSetting } from '@/services/db/settingsRepository'
import { getSeries, startSeries } from '@/services/db/seriesRepository'
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
    expect(backup).toMatchObject({ format: 'taskuda-backup', version: 3, createdAt: 1000 })
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
    JSON.stringify({ format: 'taskuda-backup', version: 3, data: {} }),
  ])('F8.6 rejects unreadable backups: %s', (text) => {
    expect(() => parseBackupFile(text)).toThrow(BackupUnreadableError)
  })

  it('AC20.7 backs up repeating series and restores them with their tasks', async () => {
    const task = await createTask({ title: 'Standup', dayKey: DAY, block: 'morning' })
    const series = await startSeries(task.id, { kind: 'weekly', weekdays: [1, 3] })
    const backup = parseBackupFile(JSON.stringify(await createBackupFile()))
    await db.recurringSeries.clear()
    await db.tasks.clear()

    await restoreBackupFile(backup)
    expect(await getSeries(series.id)).toMatchObject({ pattern: { kind: 'weekly', weekdays: [1, 3] } })
    expect((await listTasksForDay(DAY))[0].seriesId).toBe(series.id)
  })

  it('AC20.7 / RK16 still restores a version 1 file made before repeating tasks', async () => {
    const current = await createBackupFile(1000)
    const { recurringSeries: _none, ...v1Data } = current.data
    const v1 = {
      ...current,
      version: 1,
      data: {
        ...v1Data,
        tasks: [
          {
            id: 'old',
            title: 'From before',
            notes: '',
            companyId: null,
            dayKey: DAY,
            block: 'morning',
            order: 1000,
            startTime: null,
            durationMinutes: null,
            status: 'todo',
            carriedOverCount: 0,
            carriedFromTaskId: null,
            carriedToTaskId: null,
            source: 'manual',
            jiraIssue: null,
            createdAt: 1,
            updatedAt: 1,
          },
        ],
      },
    }
    const parsed = parseBackupFile(JSON.stringify(v1))
    await restoreBackupFile(parsed)
    expect(await listTasksForDay(DAY)).toEqual([expect.objectContaining({ id: 'old', seriesId: null })])
    expect(await db.recurringSeries.count()).toBe(0)
  })

  it('AC30.6 backs up due dates (format version 3)', async () => {
    await createTask({
      title: 'Invoice',
      dayKey: DAY,
      block: 'morning',
      dueDate: '2026-10-24',
      dueTime: '17:00',
    })
    const backup = parseBackupFile(JSON.stringify(await createBackupFile()))
    expect(backup.version).toBe(3)
    await db.tasks.clear()

    await restoreBackupFile(backup)
    expect((await listTasksForDay(DAY))[0]).toMatchObject({ dueDate: '2026-10-24', dueTime: '17:00' })
  })

  it('AC30.6 / RK20 still restores a version 2 file made before due dates', async () => {
    const current = await createBackupFile(1000)
    const v2 = {
      ...current,
      version: 2,
      data: {
        ...current.data,
        tasks: [
          {
            id: 'v2',
            title: 'From version 2',
            notes: '',
            companyId: null,
            dayKey: DAY,
            block: 'morning',
            order: 1000,
            startTime: null,
            durationMinutes: null,
            status: 'todo',
            carriedOverCount: 0,
            carriedFromTaskId: null,
            carriedToTaskId: null,
            source: 'manual',
            jiraIssue: null,
            seriesId: null,
            createdAt: 1,
            updatedAt: 1,
          },
        ],
      },
    }
    await restoreBackupFile(parseBackupFile(JSON.stringify(v2)))
    expect(await listTasksForDay(DAY)).toEqual([
      expect.objectContaining({ id: 'v2', dueDate: null, dueTime: null }),
    ])
  })

  it('rejects malformed dates and times from an untrusted file, so Today never crashes on them', async () => {
    await createTask({ title: 'Invoice', dayKey: DAY, block: 'morning' })
    const good = await createBackupFile()
    for (const bad of [
      { dueDate: 'not-a-date' },
      { dayKey: '2026-13-40' },
      { startTime: '25:00' },
      { dueTime: '9am' },
    ]) {
      const file = { ...good, data: { ...good.data, tasks: [{ ...good.data.tasks[0], ...bad }] } }
      expect(() => parseBackupFile(JSON.stringify(file))).toThrow(BackupUnreadableError)
    }
  })

  it('rejects a vault with an unsafe PBKDF2 iteration count', async () => {
    const good = await createBackupFile()
    const vault = {
      id: 'vault',
      version: 1,
      kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations: 1, salt: 'c2FsdA==' },
      passphraseWrappedKey: { iv: 'a', data: 'b' },
      keyCheck: { iv: 'a', data: 'b' },
      secrets: {},
      updatedAt: 1,
    }
    expect(() => parseBackupFile(JSON.stringify({ ...good, data: { ...good.data, vault } }))).toThrow(
      BackupUnreadableError,
    )
  })

  it('leaves the eye-break log and time in Taskuda on this device (task 18.2)', async () => {
    await db.eyeBreakLog.add({ at: 1, dayKey: DAY, outcome: 'done' })
    await db.screenTime.put({ dayKey: DAY, ms: 60_000 })
    const backup = await createBackupFile()
    expect(backup.data).not.toHaveProperty('eyeBreakLog')
    expect(backup.data).not.toHaveProperty('screenTime')

    await restoreBackupFile(parseBackupFile(JSON.stringify(backup)))
    expect(await db.eyeBreakLog.count()).toBe(1)
    expect(await db.screenTime.get(DAY)).toEqual({ dayKey: DAY, ms: 60_000 })
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
