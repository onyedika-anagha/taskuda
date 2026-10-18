import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { StatusToggle } from './StatusToggle'

describe('StatusToggle', () => {
  it('AC4.2 shows the status as text, not only color, and says what a tap does', () => {
    render(<StatusToggle status="in_progress" onCycle={() => {}} />)
    const button = screen.getByRole('button', { name: 'Status: In Progress. Change to Done' })
    expect(button).toHaveTextContent('In Progress')
  })

  it('DAC2 changes status with exactly one click', async () => {
    const onCycle = vi.fn<() => void>()
    render(<StatusToggle status="todo" onCycle={onCycle} />)
    await userEvent.click(screen.getByRole('button'))
    expect(onCycle).toHaveBeenCalledTimes(1)
  })

  it('DAC2 changes status with one keypress when focused', async () => {
    const onCycle = vi.fn<() => void>()
    render(<StatusToggle status="todo" onCycle={onCycle} />)
    screen.getByRole('button').focus()
    await userEvent.keyboard('{Enter}')
    expect(onCycle).toHaveBeenCalledTimes(1)
  })

  it('cannot be changed on read-only days', () => {
    render(<StatusToggle status="done" onCycle={() => {}} disabled />)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
