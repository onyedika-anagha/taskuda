import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Weekday } from '@/types/workday'
import { WeekdayPicker } from './WeekdayPicker'

function renderPicker(value: Weekday[]) {
  const onChange = vi.fn<(days: Weekday[]) => void>()
  render(
    <WeekdayPicker
      label="Working days"
      value={value}
      onChange={onChange}
      minimumHint="Keep at least one working day."
    />,
  )
  return { onChange, user: userEvent.setup() }
}

describe('WeekdayPicker', () => {
  it('labels each day with its full name and shows which are on', () => {
    renderPicker([1, 2, 3, 4, 5])
    const group = screen.getByRole('group', { name: 'Working days' })
    expect(group).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Monday' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Saturday' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('adds and removes days in Monday-first order', async () => {
    const { onChange, user } = renderPicker([1, 2])
    await user.click(screen.getByRole('button', { name: 'Sunday' }))
    expect(onChange).toHaveBeenLastCalledWith([1, 2, 0])
    await user.click(screen.getByRole('button', { name: 'Monday' }))
    expect(onChange).toHaveBeenLastCalledWith([2])
  })

  it('AC19.1 the last day can’t be unticked, and says why', async () => {
    const { onChange, user } = renderPicker([3])
    await user.click(screen.getByRole('button', { name: 'Wednesday' }))
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByText('Keep at least one working day.')).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Working days' })).toHaveAccessibleDescription(
      'Keep at least one working day.',
    )
  })
})
