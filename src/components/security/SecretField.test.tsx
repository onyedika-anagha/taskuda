import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { AppProviders } from '@/app/providers'
import {
  createVault,
  getSecret,
  getVaultStatus,
  listSecretNames,
  lockVault,
  setSecret,
} from '@/services/crypto/secretVault'
import { db } from '@/services/db/database'
import { resetVaultState } from '@/test/resetVault'
import { SecretField } from './SecretField'

const KEY = 'sk-or-v1-EXAMPLE-key-wxyz'
const PASSPHRASE = 'correct horse battery'

function renderField() {
  const user = userEvent.setup()
  render(
    <AppProviders>
      <SecretField name="openrouter" label="API key" itemName="OpenRouter key" />
    </AppProviders>,
  )
  return user
}

describe('SecretField + passphrase prompts', () => {
  beforeEach(resetVaultState)

  it('F10 first key on a device asks for a passphrase (D6), then shows only the last 4 characters', async () => {
    const user = renderField()
    await user.type(await screen.findByLabelText('API key'), KEY)
    await user.click(screen.getByRole('button', { name: 'Save' }))

    const dialog = await screen.findByRole('dialog', { name: 'Set a passphrase' })
    await user.type(within(dialog).getByLabelText('Passphrase'), 'short')
    await user.type(within(dialog).getByLabelText('Confirm passphrase'), 'different')
    await user.click(within(dialog).getByRole('button', { name: 'Set passphrase' }))
    expect(await within(dialog).findByText('Use at least 8 characters.')).toBeInTheDocument()
    expect(within(dialog).getByText('The passphrases don’t match.')).toBeInTheDocument()

    await user.clear(within(dialog).getByLabelText('Passphrase'))
    await user.type(within(dialog).getByLabelText('Passphrase'), PASSPHRASE)
    await user.clear(within(dialog).getByLabelText('Confirm passphrase'))
    await user.type(within(dialog).getByLabelText('Confirm passphrase'), PASSPHRASE)
    await user.click(within(dialog).getByRole('button', { name: 'Set passphrase' }))

    // DAC14 / AC12.2: masked, never the full key, and the input is gone.
    expect(await screen.findByText('••••••••wxyz')).toBeInTheDocument()
    expect(screen.queryByDisplayValue(KEY)).not.toBeInTheDocument()
    expect(document.body.textContent).not.toContain(KEY)
    expect(await getSecret('openrouter')).toBe(KEY)
  }, 15_000)

  it('cancelling the passphrase prompt saves nothing', async () => {
    const user = renderField()
    await user.type(await screen.findByLabelText('API key'), KEY)
    await user.click(screen.getByRole('button', { name: 'Save' }))
    const dialog = await screen.findByRole('dialog', { name: 'Set a passphrase' })
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(await getVaultStatus()).toBe('none')
    expect(screen.getByLabelText('API key')).toBeInTheDocument()
  })

  it('AC12.5 on a new device: wrong passphrase stays locked, right one unlocks', async () => {
    await createVault(PASSPHRASE)
    await setSecret('openrouter', KEY)
    lockVault()
    await db.deviceKeys.clear()

    const user = renderField()
    expect(await screen.findByText('Saved and locked on this device.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Unlock' }))

    const dialog = await screen.findByRole('dialog', { name: 'Enter your passphrase' })
    await user.type(within(dialog).getByLabelText('Passphrase'), 'wrong passphrase{Enter}')
    expect(
      await within(dialog).findByText(
        'That passphrase doesn’t match. Try again, or reset your secrets and add your keys again.',
      ),
    ).toBeInTheDocument()

    await user.clear(within(dialog).getByLabelText('Passphrase'))
    await user.type(within(dialog).getByLabelText('Passphrase'), `${PASSPHRASE}{Enter}`)
    expect(await screen.findByText('••••••••wxyz')).toBeInTheDocument()
  }, 15_000)

  it('forgotten passphrase: reset from the unlock dialog clears the keys', async () => {
    await createVault(PASSPHRASE)
    await setSecret('openrouter', KEY)
    lockVault()
    await db.deviceKeys.clear()

    const user = renderField()
    await user.click(await screen.findByRole('button', { name: 'Unlock' }))
    const dialog = await screen.findByRole('dialog', { name: 'Enter your passphrase' })
    await user.click(within(dialog).getByRole('button', { name: 'Forgot it? Reset secrets' }))
    const confirm = await screen.findByRole('alertdialog', { name: 'Reset secrets?' })
    await user.click(within(confirm).getByRole('button', { name: 'Reset secrets' }))

    await waitFor(async () => expect(await getVaultStatus()).toBe('none'))
    expect(await screen.findByLabelText('API key')).toBeInTheDocument()
  })

  it('replaces and removes a saved key', async () => {
    await createVault(PASSPHRASE)
    await setSecret('openrouter', KEY)
    const user = renderField()

    await user.click(await screen.findByRole('button', { name: 'Replace' }))
    await user.type(screen.getByLabelText('API key'), 'new-key-9876{Enter}')
    expect(await screen.findByText('••••••••9876')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Remove' }))
    const confirm = await screen.findByRole('alertdialog', { name: 'Remove your OpenRouter key?' })
    await user.click(within(confirm).getByRole('button', { name: 'Remove' }))
    await waitFor(async () => expect(await listSecretNames()).toEqual([]))
    expect(await screen.findByLabelText('API key')).toBeInTheDocument()
  })

  it('rejects an empty key without opening the passphrase prompt', async () => {
    const user = renderField()
    await user.click(await screen.findByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Paste the key first.')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
