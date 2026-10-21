import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { makeCompany, makeTask } from '@/test/factories'
import type { Task } from '@/types/task'
import { StickyNote } from './StickyNote'

function renderNote(task = makeTask(), company = makeCompany(), overlaps: Task[] = []) {
  return render(
    <StickyNote
      task={task}
      company={company}
      readOnly={false}
      overlaps={overlaps}
      onOpen={() => {}}
      onCycleStatus={() => {}}
    />,
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

  it('AC25.2 marks an overlap with the other task, in text and in the label', () => {
    const standup = makeTask({ id: 'standup', title: 'Standup', startTime: '14:15' })
    renderNote(makeTask({ startTime: '14:00' }), makeCompany(), [standup])
    expect(screen.getByText('Overlaps with Standup')).toBeInTheDocument()
    expect(
      screen.getByRole('article', { name: 'Client call, Acme, 2:00 PM, To Do, overlaps with Standup' }),
    ).toBeInTheDocument()
  })

  it('AC25.2 counts several overlapping tasks', () => {
    const others = [makeTask({ id: 'a', title: 'A' }), makeTask({ id: 'b', title: 'B' })]
    renderNote(makeTask({ startTime: '14:00' }), makeCompany(), others)
    expect(screen.getByText('Overlaps with 2 tasks')).toBeInTheDocument()
    expect(screen.getByRole('article', { name: /overlaps with 2 tasks$/ })).toBeInTheDocument()
  })

  it('AC20.2 marks a repeating task in text and in the label, never with the raw value', () => {
    render(
      <StickyNote
        task={makeTask({ startTime: '14:00' })}
        company={makeCompany()}
        readOnly={false}
        repeatKind="working_days"
        onOpen={() => {}}
        onCycleStatus={() => {}}
      />,
    )
    expect(screen.getByText('Repeats on working days')).toBeInTheDocument()
    expect(
      screen.getByRole('article', { name: 'Client call, Acme, 2:00 PM, To Do, repeats on working days' }),
    ).toBeInTheDocument()
    expect(screen.queryByText(/working_days/)).not.toBeInTheDocument()
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
