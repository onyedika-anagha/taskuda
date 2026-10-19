import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  INSTALL_SNOOZE_MS,
  isInstallSnoozed,
  listenForInstallPrompt,
  useInstallStore,
  type BeforeInstallPromptEvent,
} from '@/stores/installStore'
import { InstallPrompt } from './InstallPrompt'

function fakePrompt(outcome: 'accepted' | 'dismissed') {
  const prompt = vi.fn<() => Promise<void>>().mockResolvedValue(undefined)
  return { prompt, userChoice: Promise.resolve({ outcome }) } as unknown as BeforeInstallPromptEvent & {
    prompt: typeof prompt
  }
}

describe('InstallPrompt (PRD FR16, design F13)', () => {
  beforeEach(() => {
    window.localStorage.removeItem('taskuda.installPromptDismissedAt')
    useInstallStore.setState({ event: null, installed: false })
  })

  it('stays hidden until the browser offers installation', () => {
    render(<InstallPrompt />)
    expect(screen.queryByText('Install Taskuda for one-click access.')).not.toBeInTheDocument()
  })

  it('AC16.1 Install opens the browser’s install dialog', async () => {
    const event = fakePrompt('accepted')
    useInstallStore.setState({ event })
    render(<InstallPrompt />)
    await userEvent.click(screen.getByRole('button', { name: 'Install' }))
    expect(event.prompt).toHaveBeenCalledTimes(1)
    expect(useInstallStore.getState()).toMatchObject({ event: null, installed: true })
  })

  it('F13.2 “Not now” hides it for 30 days', async () => {
    useInstallStore.setState({ event: fakePrompt('dismissed') })
    render(<InstallPrompt />)
    await userEvent.click(screen.getByRole('button', { name: 'Not now' }))
    expect(screen.queryByText('Install Taskuda for one-click access.')).not.toBeInTheDocument()
    const now = Date.now()
    expect(isInstallSnoozed(now + INSTALL_SNOOZE_MS - 1000)).toBe(true)
    expect(isInstallSnoozed(now + INSTALL_SNOOZE_MS + 1000)).toBe(false)
  })

  it('captures the browser event and suppresses the default mini-infobar', () => {
    listenForInstallPrompt()
    const event = new Event('beforeinstallprompt', { cancelable: true })
    window.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
    expect(useInstallStore.getState().event).toBe(event)
  })
})
