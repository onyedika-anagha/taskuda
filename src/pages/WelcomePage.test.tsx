import { screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createBackupFile } from '@/services/backup/backupSnapshot'
import { createCompany, listCompanies } from '@/services/db/companyRepository'
import { getCloseoutReminder, getWorkingDays } from '@/services/workday/workdaySettings'
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
    for (const key of ['taskuda.welcomeDone', 'taskuda.setupStep', 'taskuda.introSeen']) {
      window.localStorage.removeItem(key)
    }
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
    expect(await screen.findByRole('heading', { name: 'Step 1 of 3 · Companies' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/welcome')
  })

  it('a device that already has data skips the welcome', async () => {
    await createCompany({ name: 'Acme', colorId: 'teal' })
    const { router } = renderWithApp('/')
    await screen.findByRole('region', { name: /^Morning/ })
    expect(router.state.location.pathname).toBe('/')
    // Written by an effect once the data check resolves, which can be just after the canvas shows.
    await waitFor(() => expect(window.localStorage.getItem('taskuda.welcomeDone')).toBe('1'))
  })

  it('AC34.1 / AC34.2 adds several companies, each with its own color, then continues', async () => {
    const { user } = renderWithApp('/welcome')
    const name = await screen.findByLabelText('Company name')
    expect(screen.queryByRole('button', { name: 'Continue' })).not.toBeInTheDocument()

    await user.type(name, 'Acme{Enter}') // DAC27: Enter adds it
    expect(await screen.findByRole('button', { name: 'Remove Acme' })).toBeInTheDocument()
    expect(screen.getByLabelText('Company name')).toHaveValue('')
    expect(screen.getByLabelText('Company name')).toHaveFocus()
    await user.type(screen.getByLabelText('Company name'), 'Globex')
    await user.click(screen.getByRole('button', { name: 'Add company' }))
    expect(await screen.findByRole('button', { name: 'Remove Globex' })).toBeInTheDocument()

    const companies = await listCompanies()
    expect(companies.map((c) => c.name).sort()).toEqual(['Acme', 'Globex'])
    expect(new Set(companies.map((c) => c.colorId)).size).toBe(2)

    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(await screen.findByRole('heading', { name: 'Step 2 of 3 · Workday' })).toBeInTheDocument()
  })

  it('AC34.2 rejects a duplicate name and removes a company before continuing', async () => {
    await createCompany({ name: 'Acme', colorId: 'teal' })
    window.localStorage.setItem('taskuda.setupStep', 'companies')
    const { user } = renderWithApp('/welcome')
    await user.type(await screen.findByLabelText('Company name'), 'acme{Enter}')
    expect(await screen.findByText('You already have a company called Acme.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Remove Acme' }))
    await waitFor(async () => expect(await listCompanies()).toEqual([]))
    expect(screen.getByLabelText('Company name')).toHaveFocus()
  })

  it('AC34.3 saves working days and the close-out reminder', async () => {
    window.localStorage.setItem('taskuda.setupStep', 'workday')
    const { user } = renderWithApp('/welcome')
    expect(await screen.findByRole('heading', { name: 'Step 2 of 3 · Workday' })).toBeInTheDocument()
    await user.click(await screen.findByRole('button', { name: 'Saturday' }))
    await user.click(screen.getByRole('switch', { name: 'Close-out reminder' }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))

    expect(await screen.findByRole('heading', { name: 'Step 3 of 3 · Backup' })).toBeInTheDocument()
    expect(await getWorkingDays()).toEqual([1, 2, 3, 4, 5, 6])
    expect(await getCloseoutReminder()).toBeNull()
  })

  it('AC34.3 Skip keeps the defaults', async () => {
    const { user } = renderWithApp('/welcome')
    await user.click(await screen.findByRole('button', { name: 'Skip for now' }))
    await user.click(await screen.findByRole('button', { name: 'Skip' }))
    expect(await screen.findByRole('heading', { name: 'Back up to Google Drive' })).toBeInTheDocument()
    expect(await getWorkingDays()).toEqual([1, 2, 3, 4, 5])
    expect(await getCloseoutReminder()).toBe('17:30')
    expect(await listCompanies()).toEqual([])
  })

  it('AC34.5 a closed tab resumes setup at the same step, even with a company saved', async () => {
    const first = renderWithApp('/welcome')
    await first.user.type(await screen.findByLabelText('Company name'), 'Acme{Enter}')
    await screen.findByRole('button', { name: 'Remove Acme' })
    first.unmount()

    const second = renderWithApp('/')
    expect(await screen.findByRole('heading', { name: 'Step 1 of 3 · Companies' })).toBeInTheDocument()
    expect(second.router.state.location.pathname).toBe('/welcome')
    expect(await screen.findByRole('button', { name: 'Remove Acme' })).toBeInTheDocument()
    await second.user.click(screen.getByRole('button', { name: 'Continue' }))
    await screen.findByRole('heading', { name: 'Step 2 of 3 · Workday' })
    second.unmount()

    renderWithApp('/')
    expect(await screen.findByRole('heading', { name: 'Step 2 of 3 · Workday' })).toBeInTheDocument()
  })

  it('AC34.6 “Not now” finishes on Today with the “all set” toast, and only once', async () => {
    const { user, router } = renderWithApp('/welcome')
    await user.click(await screen.findByRole('button', { name: 'Skip for now' }))
    await user.click(await screen.findByRole('button', { name: 'Skip' }))
    await user.click(await screen.findByRole('button', { name: 'Not now' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
    expect(await screen.findByText(/^You’re all set\./)).toBeInTheDocument()
    expect(await screen.findByRole('region', { name: /^Morning/ })).toBeInTheDocument()
    expect(window.localStorage.getItem('taskuda.welcomeDone')).toBe('1')
    expect(window.localStorage.getItem('taskuda.setupStep')).toBeNull()
  })

  it('F1.3 a cancelled Google sign-in explains and offers Try again / Skip', async () => {
    installFakeGis({ respond: () => ({ errorType: 'popup_closed' }) })
    const { user } = renderWithApp('/welcome')
    await user.click(await screen.findByRole('button', { name: 'Skip for now' }))
    await user.click(await screen.findByRole('button', { name: 'Skip' }))
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
    await user.click(await screen.findByRole('button', { name: 'Skip' }))
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
    await user.click(await screen.findByRole('button', { name: 'Skip' }))
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
    await user.click(await screen.findByRole('button', { name: 'Skip' }))
    await user.click(await screen.findByRole('button', { name: 'Connect Google Drive' }))
    await user.click(await screen.findByRole('button', { name: 'Start fresh' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
    await waitFor(() => expect(drive.files).toHaveLength(2))
  })
})
