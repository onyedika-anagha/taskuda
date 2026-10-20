import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { TimeRange } from '@/types/workday'
import { TimeRangeField } from './TimeRangeField'

function renderField(value: TimeRange = { start: '22:00', end: '07:00' }) {
  const onChange = vi.fn<(range: TimeRange) => void>()
  render(<TimeRangeField legend="Quiet hours" value={value} onChange={onChange} />)
  return { onChange }
}

describe('TimeRangeField', () => {
  it('names the pair and its two times', () => {
    renderField()
    expect(screen.getByRole('group', { name: 'Quiet hours' })).toBeInTheDocument()
    expect(screen.getByLabelText('From')).toHaveValue('22:00')
    expect(screen.getByLabelText('To')).toHaveValue('07:00')
  })

  it('AC23.1 says when a range runs overnight', () => {
    renderField()
    expect(screen.getByText('Runs overnight, into the next morning.')).toBeInTheDocument()
  })

  it('saves a valid change', () => {
    const { onChange } = renderField()
    fireEvent.change(screen.getByLabelText('From'), { target: { value: '21:30' } })
    expect(onChange).toHaveBeenCalledWith({ start: '21:30', end: '07:00' })
  })

  it('AC23.1 refuses the same start and end, and says why', () => {
    const { onChange } = renderField({ start: '09:00', end: '10:00' })
    fireEvent.change(screen.getByLabelText('To'), { target: { value: '09:00' } })
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByText('Start and end can’t be the same.')).toBeInTheDocument()
    expect(screen.getByLabelText('To')).toHaveAttribute('aria-invalid', 'true')
  })
})
