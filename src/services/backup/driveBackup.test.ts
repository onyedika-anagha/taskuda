import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createTask } from '@/services/db/taskRepository'
import { getSetting } from '@/services/db/settingsRepository'
import { forgetAccessToken } from '@/services/google/googleAuth'
import { installFakeDrive } from '@/test/fakeDrive'
import { installFakeGis, removeFakeGis } from '@/test/fakeGoogle'
import { resetDatabase } from '@/test/resetDatabase'
import { getDeviceId } from './deviceInfo'
import {
  LAST_BACKUP_KEY,
  MAX_BACKUP_VERSIONS,
  backupToDrive,
  downloadBackup,
  listBackupVersions,
} from './driveBackup'

describe('driveBackup', () => {
  beforeEach(async () => {
    forgetAccessToken()
    await resetDatabase()
    installFakeGis()
  })
  afterEach(() => {
    removeFakeGis()
    vi.restoreAllMocks()
  })

  it('AC7.1 uploads into the hidden app-data folder with the access token', async () => {
    const drive = installFakeDrive()
    await createTask({ title: 'Backed up', dayKey: '2026-10-19', block: 'morning' })
    await backupToDrive({ interactive: true }, 5000)

    expect(drive.files).toHaveLength(1)
    const upload = drive.requests.find((r) => r.method === 'POST')
    expect(upload?.url).toContain('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart')
    expect(upload?.headers.authorization).toBe('Bearer fake-token')
    expect(upload?.rawBody).toContain('"parents":["appDataFolder"]')
    expect(drive.files[0].appProperties).toMatchObject({ deviceId: await getDeviceId(), createdAt: '5000' })
    expect(JSON.parse(drive.files[0].content).data.tasks[0].title).toBe('Backed up')
    expect(await getSetting(LAST_BACKUP_KEY, null)).toBe(5000)
  })

  it('RK7 keeps the newest 10 versions', async () => {
    const drive = installFakeDrive()
    for (let i = 0; i < MAX_BACKUP_VERSIONS + 2; i++) await backupToDrive({ interactive: true }, 1000 + i)
    expect(drive.files).toHaveLength(MAX_BACKUP_VERSIONS)
    expect(drive.files.map((f) => f.appProperties.createdAt)).not.toContain('1000')
    expect(drive.files.map((f) => f.appProperties.createdAt)).not.toContain('1001')
  })

  it('lists versions newest first and marks this device', async () => {
    const drive = installFakeDrive()
    await backupToDrive({ interactive: true }, 1000)
    await backupToDrive({}, 2000)
    drive.files[0].appProperties.deviceId = 'another-device'
    drive.files[0].appProperties.deviceName = 'Android · Chrome'

    const versions = await listBackupVersions()
    expect(versions.map((v) => [v.createdAt, v.fromThisDevice])).toEqual([
      [2000, true],
      [1000, false],
    ])
    expect(versions[1].deviceName).toBe('Android · Chrome')
    const listCall = drive.requests.find((r) => r.method === 'GET' && r.url.includes('spaces=appDataFolder'))
    expect(listCall).toBeDefined()
  })

  it('downloads and validates a version', async () => {
    const drive = installFakeDrive()
    await backupToDrive({ interactive: true }, 1000)
    expect((await downloadBackup(drive.files[0].id)).createdAt).toBe(1000)

    drive.files[0].content = '{"broken":'
    await expect(downloadBackup(drive.files[0].id)).rejects.toThrow(
      'This backup can’t be read. Try an older version.',
    )
  })

  it('reports an expired session as auth-expired and forgets the token', async () => {
    const drive = installFakeDrive()
    await backupToDrive({ interactive: true }, 1000)
    drive.state.failNext = 401
    await expect(backupToDrive({}, 2000)).rejects.toMatchObject({ kind: 'auth-expired' })
  })
})
