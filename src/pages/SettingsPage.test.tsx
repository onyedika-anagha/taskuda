import { act, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useInstallStore, type BeforeInstallPromptEvent } from '@/stores/installStore'
import { renderWithApp } from '@/test/renderWithApp'
import { resetDatabase } from '@/test/resetDatabase'
import { setViewport } from '@/test/viewport'

const SECTION_LABELS = ['Companies', 'Backup', 'AI & Security', 'Stats', 'About']

describe('Settings layout (S7, design spec Section 6)', () => {
  beforeEach(async () => {
    await resetDatabase()
    useInstallStore.setState({ event: null, installed: false })
  })

  it('desktop: side navigation, opening on the first section', async () => {
    setViewport('desktop')
    const { router } = renderWithApp('/settings')
    const nav = await screen.findByRole('navigation', { name: 'Settings sections' })
    expect(nav.querySelectorAll('a')).toHaveLength(SECTION_LABELS.length)
    expect(router.state.location.pathname).toBe('/settings/companies')
    expect(screen.getByRole('link', { name: 'Companies' })).toHaveAttribute('aria-current', 'page')
  })

  it('phone: a list of sections, each opening as a page with a way back', async () => {
    setViewport('phone')
    const { user, router } = renderWithApp('/settings')
    for (const label of SECTION_LABELS)
      expect(await screen.findByRole('link', { name: label })).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Stats' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Stats' })).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Back to settings' }))
    expect(router.state.location.pathname).toBe('/settings')
  })

  it('unknown sections go back to the list', async () => {
    const { router } = renderWithApp('/settings/nope')
    await screen.findByRole('navigation', { name: 'Settings sections' })
    expect(router.state.location.pathname).toBe('/settings')
  })

  it('S7g About: version, privacy summary, and Install when the browser offers it', async () => {
    renderWithApp('/settings/about')
    expect(await screen.findByText(/Version \d+\.\d+\.\d+/)).toBeInTheDocument()
    expect(
      screen.getByText(
        'Your data stays on your device and in your own Google Drive. Taskuda has no server that stores your tasks or keys.',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Install Taskuda' })).not.toBeInTheDocument()

    const prompt = {
      prompt: async () => {},
      userChoice: Promise.resolve({ outcome: 'accepted' as const }),
    } as unknown as BeforeInstallPromptEvent
    act(() => useInstallStore.setState({ event: prompt }))
    expect(await screen.findByRole('button', { name: 'Install Taskuda' })).toBeInTheDocument()
  })
})
