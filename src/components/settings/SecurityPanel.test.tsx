import { screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  createVault,
  getSecret,
  getVaultStatus,
  lockVault,
  setSecret,
  unlockWithPassphrase,
} from '@/services/crypto/secretVault'
import { db } from '@/services/db/database'
import { renderWithApp } from '@/test/renderWithApp'
import { resetVaultState } from '@/test/resetVault'

const PASSPHRASE = 'correct horse battery'

describe('AI & Security settings: Security panel', () => {
  beforeEach(resetVaultState)

  it('explains that a passphrase comes with the first key', async () => {
    renderWithApp('/settings/ai-security')
    expect(
      await screen.findByText('No passphrase yet. You’ll set one when you save your first key.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'AI & Security' })).toHaveAttribute('aria-current', 'page')
  })

  it('changes the passphrase after checking the current one', async () => {
    await createVault(PASSPHRASE)
    await setSecret('gemini', 'gemini-key')
    const { user } = renderWithApp('/settings/ai-security')
    await user.click(await screen.findByRole('button', { name: 'Change passphrase' }))

    const dialog = await screen.findByRole('dialog', { name: 'Change passphrase' })
    await user.type(within(dialog).getByLabelText('Current passphrase'), 'wrong passphrase')
    await user.type(within(dialog).getByLabelText('New passphrase'), 'a new passphrase')
    await user.type(within(dialog).getByLabelText('Confirm new passphrase'), 'a new passphrase')
    await user.click(within(dialog).getByRole('button', { name: 'Change passphrase' }))
    expect(await within(dialog).findByText('That passphrase doesn’t match.')).toBeInTheDocument()

    await user.clear(within(dialog).getByLabelText('Current passphrase'))
    await user.type(within(dialog).getByLabelText('Current passphrase'), PASSPHRASE)
    await user.click(within(dialog).getByRole('button', { name: 'Change passphrase' }))
    // Two PBKDF2 derivations (600k iterations each) run before the toast.
    expect(await screen.findByText('Passphrase changed', {}, { timeout: 8000 })).toBeInTheDocument()

    lockVault()
    await db.deviceKeys.clear()
    await unlockWithPassphrase('a new passphrase')
    expect(await getSecret('gemini')).toBe('gemini-key')
  }, 20_000)

  it('resets secrets after confirmation', async () => {
    await createVault(PASSPHRASE)
    const { user } = renderWithApp('/settings/ai-security')
    await user.click(await screen.findByRole('button', { name: 'Reset secrets' }))
    const confirm = await screen.findByRole('alertdialog', { name: 'Reset secrets?' })
    await user.click(within(confirm).getByRole('button', { name: 'Reset secrets' }))
    await waitFor(async () => expect(await getVaultStatus()).toBe('none'))
  })
})
