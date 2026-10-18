import { screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setAiProvider } from '@/services/ai/aiSettings'
import { createVault, setSecret } from '@/services/crypto/secretVault'
import { createTask } from '@/services/db/taskRepository'
import { useCloseoutStore } from '@/stores/closeoutStore'
import { useRecommendationsStore } from '@/stores/recommendationsStore'
import { geminiAnswer, jsonResponse, mockFetch } from '@/test/mockFetch'
import { renderWithApp } from '@/test/renderWithApp'
import { resetVaultState } from '@/test/resetVault'
import { todayKey } from '@/utils/dates'

const RECS = [
  { title: 'Batch your calls', detail: 'Put client calls back to back after lunch.' },
  { title: 'Start with the spec', detail: 'It was carried twice; do it first.' },
]

async function goToRecommendations() {
  const app = renderWithApp('/')
  const { user } = app
  await user.click(await screen.findByRole('button', { name: 'Close out day' }))
  const dialog = await screen.findByRole('dialog', { name: /^Close out / })
  await user.click(within(dialog).getByRole('button', { name: 'Carry over all' }))
  await user.click(within(dialog).getByRole('button', { name: 'Next' }))
  await user.click(await within(dialog).findByRole('radio', { name: /^3/ }))
  await user.click(within(dialog).getByRole('button', { name: 'Next' }))
  await within(dialog).findByText('Step 3 of 4: Recommendations')
  return { ...app, dialog }
}

async function configureGemini() {
  await createVault('correct horse battery')
  await setSecret('gemini', 'g-key')
  await setAiProvider('gemini')
}

describe('Closeout step 3: AI recommendations', () => {
  beforeEach(async () => {
    useCloseoutStore.setState({ view: { mode: 'closed' } })
    useRecommendationsStore.setState({ request: { status: 'idle' } })
    await resetVaultState()
    await createTask({ title: 'Write spec', dayKey: todayKey(), block: 'morning' })
  })
  afterEach(() => vi.restoreAllMocks())

  it('AC13.2 without a key: explains, links to Settings, and Skip still works', async () => {
    const { user, dialog } = await goToRecommendations()
    expect(within(dialog).getByText('Add an AI key in Settings to get recommendations.')).toBeInTheDocument()
    expect(within(dialog).getByRole('link', { name: 'Open Settings' })).toHaveAttribute(
      'href',
      '/settings/ai-security',
    )
    await user.click(within(dialog).getByRole('button', { name: 'Skip' }))
    expect(await within(dialog).findByText('Step 4 of 4: Report')).toBeInTheDocument()
  })

  it('AC13.3 asks before the first request, then AC13.1 shows recommendations', async () => {
    await configureGemini()
    const { requests } = mockFetch(() => geminiAnswer(RECS))
    const { user, dialog } = await goToRecommendations()

    expect(
      within(dialog).getByText(
        'To get recommendations, Taskuda sends today’s task titles, statuses, companies, carryovers, and your reflection to Gemini using your key. Nothing is sent to Taskuda.',
      ),
    ).toBeInTheDocument()
    expect(requests).toHaveLength(0)

    await user.click(within(dialog).getByRole('button', { name: 'Send to Gemini' }))
    expect(await within(dialog).findByText('Batch your calls')).toBeInTheDocument()
    expect(within(dialog).getByText('It was carried twice; do it first.')).toBeInTheDocument()
    expect(requests).toHaveLength(1)
    expect(new URL(requests[0].url).host).toBe('generativelanguage.googleapis.com')
    expect(within(dialog).getByRole('button', { name: 'Next' })).toBeInTheDocument()

    // Going back and forth reuses the saved answer instead of asking again.
    await user.click(within(dialog).getByRole('button', { name: 'Back' }))
    await user.click(await within(dialog).findByRole('button', { name: 'Next' }))
    expect(await within(dialog).findByText('Batch your calls')).toBeInTheDocument()
    expect(requests).toHaveLength(1)
  })

  it('provider error: names the reason, Try again recovers', async () => {
    await configureGemini()
    let fail = true
    mockFetch(() => (fail ? jsonResponse({}, 429) : geminiAnswer(RECS)))
    const { user, dialog } = await goToRecommendations()
    await user.click(within(dialog).getByRole('button', { name: 'Send to Gemini' }))
    expect(await within(dialog).findByText('Gemini didn’t respond: rate limit reached.')).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Skip' })).toBeInTheDocument()

    fail = false
    await user.click(within(dialog).getByRole('button', { name: 'Try again' }))
    expect(await within(dialog).findByText('Batch your calls')).toBeInTheDocument()
  })

  it('offline: explains and still lets the closeout finish', async () => {
    await configureGemini()
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    const { requests } = mockFetch(() => geminiAnswer(RECS))
    const { user, dialog } = await goToRecommendations()
    await user.click(within(dialog).getByRole('button', { name: 'Send to Gemini' }))
    expect(
      await within(dialog).findByText(
        'You’re offline, so recommendations aren’t available. You can still finish your closeout.',
      ),
    ).toBeInTheDocument()
    expect(requests).toHaveLength(0)
  })
})
