import { screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createBackupFile } from '@/services/backup/backupSnapshot'
import { createCompany, listCompanies } from '@/services/db/companyRepository'
import { listTasksForDay } from '@/services/db/taskRepository'
import { forgetAccessToken } from '@/services/google/googleAuth'
import { useBackupStore } from '@/stores/backupStore'
import { makeTask } from '@/test/factories'
import { installFakeDrive } from '@/test/fakeDrive'
import { installFakeGis, removeFakeGis } from '@/test/fakeGoogle'
import { renderWithApp } from '@/test/renderWithApp'
import { resetVaultState } from '@/test/resetVault'

describe('Welcome (S1)', () => {
  beforeEach(async () => {
    window.localStorage.removeItem('taskuda.welcomeDone')
    forgetAccessToken()
    useBackupStore.setState({ status: { state: 'loading' }, connected: false })
    await resetVaultState()
  })
  afterEach(() => {
    removeFakeGis()
    vi.restoreAllMocks()
  })

  it('F1 first run: opening the app goes to the welcome', async () => {
    const { router } = renderWithApp('/')
    expect(
      await screen.findByRole('heading', { name: 'Plan your day across every job.' }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/welcome')
  })

  it('a device that already has data skips the welcome', async () => {
    await createCompany({ name: 'Acme', colorId: 'teal' })
    const { router } = renderWithApp('/')
    await screen.findByRole('region', { name: /^Morning/ })
    expect(router.state.location.pathname).toBe('/')
    expect(window.localStorage.getItem('taskuda.welcomeDone')).toBe('1')
  })

  it('F1.2 adds the first company, then F1.3 “Not now” finishes on an empty today', async () => {
    const { user, router } = renderWithApp('/welcome')
    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument()
    await user.type(await screen.findByLabelText('Name'), 'Acme')
    await user.click(screen.getByRole('button', { name: 'Continue' }))

    expect(await screen.findByRole('heading', { name: 'Back up to Google Drive' })).toBeInTheDocument()
    expect(screen.getByText('Step 2 of 3')).toBeInTheDocument()
    expect((await listCompanies()).map((c) => c.name)).toEqual(['Acme'])
    await user.click(screen.getByRole('button', { name: 'Not now' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
    expect(await screen.findByRole('region', { name: /^Morning/ })).toBeInTheDocument()
    // Done once: reopening doesn't show the welcome again.
    expect(window.localStorage.getItem('taskuda.welcomeDone')).toBe('1')
  })

  it('“Skip for now” moves on without a company', async () => {
    const { user } = renderWithApp('/welcome')
    await user.click(await screen.findByRole('button', { name: 'Skip for now' }))
    expect(await screen.findByRole('heading', { name: 'Back up to Google Drive' })).toBeInTheDocument()
    expect(await listCompanies()).toEqual([])
  })

  it('F1.3 a cancelled Google sign-in explains and offers Try again / Skip', async () => {
    installFakeGis({ respond: () => ({ errorType: 'popup_closed' }) })
    const { user } = renderWithApp('/welcome')
    await user.click(await screen.findByRole('button', { name: 'Skip for now' }))
    await user.click(await screen.findByRole('button', { name: 'Connect Google Drive' }))
    expect(
      await screen.findByText('Google sign-in was cancelled. You can connect later in Settings.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Skip' })).toBeInTheDocument()
  })

  it('connecting with no existing backup backs up and finishes', async () => {
    installFakeGis()
    const drive = installFakeDrive()
    const { user, router } = renderWithApp('/welcome')
    await user.click(await screen.findByRole('button', { name: 'Skip for now' }))
    await user.click(await screen.findByRole('button', { name: 'Connect Google Drive' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
    await waitFor(() => expect(drive.files).toHaveLength(1))
  })

  it('F1.4 / F8 finds an existing backup and restores it before backing up', async () => {
    installFakeGis()
    const drive = installFakeDrive()
    const backup = await createBackupFile(new Date(2026, 9, 17, 21, 14).getTime())
    backup.data.tasks = [makeTask({ title: 'From my laptop', dayKey: '2026-10-19' })]
    drive.files.push({
      id: 'old-backup',
      name: 'taskuda-backup-old.json',
      createdTime: '2026-10-17T20:14:00.000Z',
      appProperties: {
        deviceId: 'laptop',
        deviceName: 'Windows · Chrome',
        createdAt: String(backup.createdAt),
      },
      content: JSON.stringify({ ...backup, deviceId: 'laptop' }),
    })

    const { user, router } = renderWithApp('/welcome')
    await user.click(await screen.findByRole('button', { name: 'Skip for now' }))
    await user.click(await screen.findByRole('button', { name: 'Connect Google Drive' }))

    expect(await screen.findByRole('heading', { name: 'Found a backup from Oct 17' })).toBeInTheDocument()
    expect(drive.files).toHaveLength(1) // nothing uploaded over it yet
    await user.click(screen.getByRole('button', { name: 'Restore' }))
    const confirm = await screen.findByRole('alertdialog', { name: 'Restore this backup?' })
    await user.click(within(confirm).getByRole('button', { name: 'Restore' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
    expect((await listTasksForDay('2026-10-19')).map((t) => t.title)).toEqual(['From my laptop'])
  })

  it('“Start fresh” ignores the found backup', async () => {
    installFakeGis()
    const drive = installFakeDrive()
    const backup = await createBackupFile(1000)
    drive.files.push({
      id: 'old',
      name: 'taskuda-backup-old.json',
      createdTime: '2026-10-17T20:14:00.000Z',
      appProperties: { deviceId: 'laptop', deviceName: 'Windows · Chrome', createdAt: '1000' },
      content: JSON.stringify(backup),
    })
    const { user, router } = renderWithApp('/welcome')
    await user.click(await screen.findByRole('button', { name: 'Skip for now' }))
    await user.click(await screen.findByRole('button', { name: 'Connect Google Drive' }))
    await user.click(await screen.findByRole('button', { name: 'Start fresh' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
    await waitFor(() => expect(drive.files).toHaveLength(2))
  })
})
