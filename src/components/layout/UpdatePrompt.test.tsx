import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Toaster } from 'sonner'
import { describe, expect, it, vi } from 'vitest'
import { UpdatePrompt } from './UpdatePrompt'

const updateServiceWorker = vi.fn<(reload?: boolean) => Promise<void>>().mockResolvedValue(undefined)
let triggerNeedRefresh: () => void = () => {}

vi.mock('virtual:pwa-register', () => ({
  registerSW: (options: { onNeedRefresh?: () => void }) => {
    triggerNeedRefresh = () => options.onNeedRefresh?.()
    return updateServiceWorker
  },
}))

describe('UpdatePrompt (PRD AC16.2, design F13.3)', () => {
  it('offers Reload when a new version is waiting, and Reload activates it', async () => {
    Object.defineProperty(navigator, 'serviceWorker', { value: {}, configurable: true })
    render(
      <>
        <Toaster />
        <UpdatePrompt />
      </>,
    )
    triggerNeedRefresh()
    expect(await screen.findByText('Taskuda updated. Reload to get the latest version.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Reload' }))
    expect(updateServiceWorker).toHaveBeenCalledWith(true)
  })
})
