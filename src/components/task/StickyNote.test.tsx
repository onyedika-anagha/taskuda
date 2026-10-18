import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { makeCompany, makeTask } from '@/test/factories'
import { StickyNote } from './StickyNote'

function renderNote(task = makeTask(), company = makeCompany()) {
  return render(
    <StickyNote task={task} company={company} readOnly={false} onOpen={() => {}} onCycleStatus={() => {}} />,
  )
}

describe('StickyNote', () => {
  it('AC5.2 shows the company name next to its color', () => {
    renderNote()
    expect(screen.getByText('Acme')).toBeInTheDocument()
  })

  it('has a full screen-reader label (design spec Section 7)', () => {
    renderNote(makeTask({ startTime: '14:00', status: 'in_progress' }))
    expect(
      screen.getByRole('article', { name: 'Client call, Acme, 2:00 PM, In Progress' }),
    ).toBeInTheDocument()
  })

  it('shows the start time and duration in human format', () => {
    renderNote(makeTask({ startTime: '14:00', durationMinutes: 90 }))
    expect(screen.getByText('2:00 PM · 1 h 30 min')).toBeInTheDocument()
  })

  it('AC11.1 / AC11.2 marks carried-over tasks with a count', () => {
    renderNote(makeTask({ carriedOverCount: 2 }))
    expect(screen.getByText('Carried over ×2')).toBeInTheDocument()
  })

  it('labels calendar-sourced tasks', () => {
    renderNote(makeTask({ source: 'calendar' }))
    expect(screen.getByText('From Google Calendar')).toBeInTheDocument()
  })

  it('opens the editor from the title button', () => {
    renderNote()
    expect(screen.getByRole('button', { name: 'Edit Client call' })).toBeEnabled()
  })

  it('disables editing on read-only days', () => {
    render(
      <StickyNote
        task={makeTask()}
        company={undefined}
        readOnly
        onOpen={() => {}}
        onCycleStatus={() => {}}
      />,
    )
    expect(screen.getByRole('button', { name: 'Edit Client call' })).toBeDisabled()
  })
})
