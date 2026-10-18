import { screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getAiSettings } from '@/services/ai/aiSettings'
import { createVault, getSecret, setSecret } from '@/services/crypto/secretVault'
import { setAiProvider } from '@/services/ai/aiSettings'
import { jsonResponse, mockFetch } from '@/test/mockFetch'
import { renderWithApp } from '@/test/renderWithApp'
import { resetVaultState } from '@/test/resetVault'

const PASSPHRASE = 'correct horse battery'

describe('AI & Security: AI provider panel (S7d)', () => {
  beforeEach(resetVaultState)
  afterEach(() => vi.restoreAllMocks())

  it('starts off with AI turned off', async () => {
    renderWithApp('/settings/ai-security')
    expect(await screen.findByText('No AI key added. AI recommendations are off.')).toBeInTheDocument()
    expect(screen.getByText('Pick a provider to add your key.')).toBeInTheDocument()
  })

  it('AC12.1 picks a provider and saves a key (setting the passphrase first)', async () => {
    const { user } = renderWithApp('/settings/ai-security')
    await user.click(await screen.findByRole('radio', { name: 'OpenRouter' }))
    await user.type(await screen.findByLabelText('API key'), 'sk-or-key-abcd')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    const dialog = await screen.findByRole('dialog', { name: 'Set a passphrase' })
    await user.type(within(dialog).getByLabelText('Passphrase'), PASSPHRASE)
    await user.type(within(dialog).getByLabelText('Confirm passphrase'), PASSPHRASE)
    await user.click(within(dialog).getByRole('button', { name: 'Set passphrase' }))

    expect(await screen.findByText('••••••••abcd')).toBeInTheDocument()
    expect(await getSecret('openrouter')).toBe('sk-or-key-abcd')
    expect((await getAiSettings()).provider).toBe('openrouter')
    expect(screen.getByRole('link', { name: /Get an OpenRouter key/ })).toHaveAttribute(
      'href',
      'https://openrouter.ai/keys',
    )
  }, 15_000)

  it('saves a custom model on blur and falls back to the default when cleared', async () => {
    await setAiProvider('gemini')
    const { user } = renderWithApp('/settings/ai-security')
    const model = await screen.findByLabelText('Model')
    expect(model).toHaveValue('gemini-3.5-flash-lite')
    await user.clear(model)
    await user.type(model, 'gemini-3.8-flash')
    await user.tab()
    await waitFor(async () => expect((await getAiSettings()).models.gemini).toBe('gemini-3.8-flash'))

    await user.clear(screen.getByLabelText('Model'))
    await user.tab()
    await waitFor(async () => expect((await getAiSettings()).models.gemini).toBe('gemini-3.5-flash-lite'))
  })

  it('F10.3 tests the key: works / rejected', async () => {
    await createVault(PASSPHRASE)
    await setSecret('gemini', 'g-key-1234')
    await setAiProvider('gemini')
    let status = 200
    mockFetch(() => jsonResponse({}, status))
    const { user } = renderWithApp('/settings/ai-security')

    await user.click(await screen.findByRole('button', { name: 'Test key' }))
    expect(await screen.findByText('Key works.')).toBeInTheDocument()

    status = 401
    await user.click(screen.getByRole('button', { name: 'Test key' }))
    expect(await screen.findByText('Gemini rejected this key.')).toBeInTheDocument()
  })

  it('Test key is disabled until a key is saved', async () => {
    await setAiProvider('gemini')
    renderWithApp('/settings/ai-security')
    expect(await screen.findByRole('button', { name: 'Test key' })).toBeDisabled()
  })
})
