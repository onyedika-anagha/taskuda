import { screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createBackupFile } from '@/services/backup/backupSnapshot'
import { backupToDrive } from '@/services/backup/driveBackup'
import { createVault, getVaultStatus, listSecretNames, setSecret } from '@/services/crypto/secretVault'
import { db } from '@/services/db/database'
import { setSetting } from '@/services/db/settingsRepository'
import { createTask, listTasksForDay } from '@/services/db/taskRepository'
import { forgetAccessToken } from '@/services/google/googleAuth'
import { useBackupStore } from '@/stores/backupStore'
import { installFakeDrive } from '@/test/fakeDrive'
import { installFakeGis, removeFakeGis } from '@/test/fakeGoogle'
import { renderWithApp } from '@/test/renderWithApp'
import { resetVaultState } from '@/test/resetVault'

const DAY = '2026-10-19'
const PASSPHRASE = 'correct horse battery'

const titles = async () => (await listTasksForDay(DAY)).map((t) => t.title)

describe('Backup settings (S7c)', () => {
  beforeEach(async () => {
    forgetAccessToken()
    useBackupStore.setState({ status: { state: 'loading' }, connected: false })
    await resetVaultState()
  })
  afterEach(() => {
    removeFakeGis()
    vi.restoreAllMocks()
  })

  it('explains that data is only on this device until Drive is connected', async () => {
    renderWithApp('/settings/backup')
    expect(
      await screen.findByText(
        'Your data is only on this device. Connect Google Drive to back it up. Taskuda can only see its own backup file, not your other Drive files.',
      ),
    ).toBeInTheDocument()
  })

  it('F7.1 connects and backs up', async () => {
    installFakeGis()
    const drive = installFakeDrive()
    const { user } = renderWithApp('/settings/backup')
    await user.click(await screen.findByRole('button', { name: 'Connect Google Drive' }))
    expect(await screen.findByText('Google Drive connected')).toBeInTheDocument()
    const panel = screen.getByRole('region', { name: 'Google Drive' })
    expect(await within(panel).findByText('Backed up just now')).toBeInTheDocument()
    expect(drive.files).toHaveLength(1)
    // The app bar indicator agrees.
    expect(screen.getByRole('link', { name: 'Backed up just now. Backup settings' })).toBeInTheDocument()
  })

  it('shows a cancelled sign-in without connecting', async () => {
    installFakeGis({ respond: () => ({ errorType: 'popup_closed' }) })
    const { user } = renderWithApp('/settings/backup')
    await user.click(await screen.findByRole('button', { name: 'Connect Google Drive' }))
    expect(
      await screen.findByText('Google sign-in was cancelled. You can connect later in Settings.'),
    ).toBeInTheDocument()
    expect(useBackupStore.getState().connected).toBe(false)
  })

  it('F8 / AC7.4 restores a version from another device after a warning', async () => {
    installFakeGis()
    const drive = installFakeDrive()
    await createTask({ title: 'From backup', dayKey: DAY, block: 'morning' })
    await backupToDrive({ interactive: true }, new Date(2026, 9, 17, 21, 14).getTime())
    drive.files[0].appProperties.deviceId = 'other-device'
    drive.files[0].content = JSON.stringify({
      ...JSON.parse(drive.files[0].content),
      deviceId: 'other-device',
    })
    await createTask({ title: 'Made later here', dayKey: DAY, block: 'evening' })

    const { user } = renderWithApp('/settings/backup')
    await user.click(await screen.findByRole('button', { name: 'Restore from Drive' }))
    const list = await screen.findByRole('dialog', { name: 'Restore from Google Drive' })
    await user.click(await within(list).findByRole('button', { name: /Sat, Oct 17 · 9:14 PM/ }))

    const confirm = await screen.findByRole('alertdialog', { name: 'Restore this backup?' })
    expect(confirm).toHaveTextContent(
      'This replaces everything on this device with the backup from Oct 17, 9:14 PM.',
    )
    expect(confirm).toHaveTextContent('This backup was made on another device')
    await user.click(within(confirm).getByRole('button', { name: 'Restore' }))

    expect(await screen.findByText('Restored backup from Oct 17, 9:14 PM')).toBeInTheDocument()
    expect(await titles()).toEqual(['From backup'])
  })

  it('F8.4 a backup with locked keys asks for the passphrase, or restores without keys', async () => {
    installFakeGis()
    installFakeDrive()
    await createVault(PASSPHRASE)
    await setSecret('gemini', 'AIza-key')
    await backupToDrive({ interactive: true }, 1000)
    // A new device: no device key, so the restored keys are locked.
    await db.deviceKeys.clear()

    const { user } = renderWithApp('/settings/backup')
    await user.click(await screen.findByRole('button', { name: 'Restore from Drive' }))
    const list = await screen.findByRole('dialog', { name: 'Restore from Google Drive' })
    await user.click((await within(list).findAllByRole('button', { name: /·/ }))[0])
    await user.click(
      within(await screen.findByRole('alertdialog', { name: 'Restore this backup?' })).getByRole('button', {
        name: 'Restore',
      }),
    )

    const unlock = await screen.findByRole('dialog', { name: 'Enter your passphrase' })
    await user.type(within(unlock).getByLabelText('Passphrase'), 'wrong passphrase{Enter}')
    expect(
      await within(unlock).findByText(
        'That passphrase doesn’t match. Try again, or restore without keys and add them again later.',
      ),
    ).toBeInTheDocument()
    await user.click(within(unlock).getByRole('button', { name: 'Restore without keys' }))

    expect(await screen.findByText(/Add your AI key and Jira token again in Settings\.$/)).toBeInTheDocument()
    expect(await getVaultStatus()).toBe('none')
    expect(await listSecretNames()).toEqual([])
  }, 20_000)

  it('F8.6 an unreadable version says so and keeps the list open', async () => {
    installFakeGis()
    const drive = installFakeDrive()
    await backupToDrive({ interactive: true }, 1000)
    drive.files[0].content = 'garbage'
    const { user } = renderWithApp('/settings/backup')
    await user.click(await screen.findByRole('button', { name: 'Restore from Drive' }))
    const list = await screen.findByRole('dialog', { name: 'Restore from Google Drive' })
    await user.click((await within(list).findAllByRole('button', { name: /·/ }))[0])
    expect(await screen.findByText('This backup can’t be read. Try an older version.')).toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Restore from Google Drive' })).toBeInTheDocument()
  })

  it('shows an empty backup list', async () => {
    installFakeGis()
    installFakeDrive()
    const { user } = renderWithApp('/settings/backup')
    await user.click(await screen.findByRole('button', { name: 'Restore from Drive' }))
    expect(await screen.findByText('No backups in your Google Drive yet.')).toBeInTheDocument()
  })

  it('CR2 imports a backup file after confirmation', async () => {
    await createTask({ title: 'In the file', dayKey: DAY, block: 'morning' })
    const text = JSON.stringify(await createBackupFile(new Date(2026, 9, 17, 9, 0).getTime()))
    await db.tasks.clear()

    const { user, container } = renderWithApp('/settings/backup')
    await screen.findByRole('button', { name: 'Import from file' })
    const input = container.ownerDocument.querySelector<HTMLInputElement>('input[type="file"]')
    if (!input) throw new Error('file input missing')
    await user.upload(input, new File([text], 'taskuda-backup.json', { type: 'application/json' }))

    const confirm = await screen.findByRole('alertdialog', { name: 'Restore this backup?' })
    expect(confirm).not.toHaveTextContent('another device')
    await user.click(within(confirm).getByRole('button', { name: 'Restore' }))
    await waitFor(async () => expect(await titles()).toEqual(['In the file']))
  })

  it('CR2 exports a backup file', async () => {
    const createObjectURL = vi.fn<(blob: Blob) => string>(() => 'blob:taskuda')
    URL.createObjectURL = createObjectURL
    URL.revokeObjectURL = vi.fn<(url: string) => void>()
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    await setSetting('voice.leadMinutes', 10)

    const { user } = renderWithApp('/settings/backup')
    await user.click(await screen.findByRole('button', { name: 'Export to file' }))
    expect(await screen.findByText('Backup file saved')).toBeInTheDocument()
    expect(click).toHaveBeenCalledTimes(1)
    const blob = createObjectURL.mock.calls[0][0]
    expect(JSON.parse(await blob.text())).toMatchObject({ format: 'taskuda-backup', version: 3 })
  })
})
