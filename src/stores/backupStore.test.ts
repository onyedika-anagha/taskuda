import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { trackBackedUpChanges } from '@/services/backup/changeTracking'
import { setSetting } from '@/services/db/settingsRepository'
import { createTask } from '@/services/db/taskRepository'
import { forgetAccessToken } from '@/services/google/googleAuth'
import { installFakeDrive } from '@/test/fakeDrive'
import { installFakeGis, removeFakeGis } from '@/test/fakeGoogle'
import { resetDatabase } from '@/test/resetDatabase'
import { BACKUP_DEBOUNCE_MS, useBackupStore } from './backupStore'

describe('backupStore', () => {
  beforeEach(async () => {
    forgetAccessToken()
    useBackupStore.setState({ status: { state: 'loading' }, connected: false })
    await resetDatabase()
  })
  afterEach(() => {
    removeFakeGis()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('starts not connected', async () => {
    await useBackupStore.getState().init()
    expect(useBackupStore.getState().status).toEqual({ state: 'not-connected' })
  })

  it('F7.1 connecting backs up right away', async () => {
    installFakeGis()
    const drive = installFakeDrive()
    await useBackupStore.getState().connect()
    expect(drive.files).toHaveLength(1)
    expect(useBackupStore.getState()).toMatchObject({ connected: true, status: { state: 'idle' } })
  })

  it('AC7.1 backs up within a minute after a change, once for a burst of edits', async () => {
    installFakeGis()
    const drive = installFakeDrive()
    await useBackupStore.getState().connect()
    // Only the debounce timer is faked; fake IndexedDB needs real setImmediate to run.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const stop = trackBackedUpChanges(useBackupStore.getState().scheduleBackup)

    await createTask({ title: 'A', dayKey: '2026-10-19', block: 'morning' })
    await createTask({ title: 'B', dayKey: '2026-10-19', block: 'morning' })
    await vi.advanceTimersByTimeAsync(BACKUP_DEBOUNCE_MS - 1000)
    expect(drive.files).toHaveLength(1)
    await vi.advanceTimersByTimeAsync(2000)
    await vi.waitFor(() => expect(drive.files).toHaveLength(2))
    expect(BACKUP_DEBOUNCE_MS).toBeLessThan(60_000)
    stop()
  })

  it('local-only settings (like the last backup time) don’t trigger backups', async () => {
    const onChange = vi.fn<() => void>()
    const stop = trackBackedUpChanges(onChange)
    await setSetting('drive.lastBackupAt', 1)
    await setSetting('device.id', 'x')
    await Promise.resolve()
    expect(onChange).not.toHaveBeenCalled()
    await setSetting('ai.provider', 'gemini')
    await vi.waitFor(() => expect(onChange).toHaveBeenCalled())
    stop()
  })

  it('F7.3 offline: waits, and says so', async () => {
    installFakeGis()
    installFakeDrive()
    await useBackupStore.getState().connect()
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    await useBackupStore.getState().backupNow()
    expect(useBackupStore.getState().status).toEqual({ state: 'offline' })
  })

  it('F7.4 an expired session that needs a click shows "Reconnect Google"', async () => {
    let silent = false
    installFakeGis({
      respond: (config) => (silent ? { error: 'interaction_required' } : { token: 't', scope: config.scope }),
    })
    const drive = installFakeDrive()
    await useBackupStore.getState().connect()
    silent = true
    forgetAccessToken()
    await useBackupStore.getState().backupNow()
    expect(useBackupStore.getState().status).toEqual({ state: 'reconnect' })

    silent = false
    await useBackupStore.getState().backupNow({ interactive: true })
    expect(useBackupStore.getState().status.state).toBe('idle')
    expect(drive.files).toHaveLength(2)
  })

  it('F7.4 a Drive error shows "Backup failed" with the reason', async () => {
    installFakeGis()
    const drive = installFakeDrive()
    await useBackupStore.getState().connect()
    drive.state.failNext = 500
    await useBackupStore.getState().backupNow()
    expect(useBackupStore.getState().status).toEqual({
      state: 'failed',
      reason: 'Google Drive returned an error',
    })
  })

  it('disconnect revokes access and stops backups', async () => {
    const gis = installFakeGis()
    installFakeDrive()
    await useBackupStore.getState().connect()
    await useBackupStore.getState().disconnect()
    expect(gis.revoked).toEqual(['fake-token'])
    expect(useBackupStore.getState()).toMatchObject({ connected: false, status: { state: 'not-connected' } })
  })
})
