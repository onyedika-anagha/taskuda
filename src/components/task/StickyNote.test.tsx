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

  describe('due dates and at-risk markers (PRD FR30, FR31)', () => {
    const TODAY = '2026-10-21'
    function renderWithRisk(task: Task, risk: Parameters<typeof StickyNote>[0]['risk'] = null) {
      return render(
        <StickyNote
          task={task}
          company={undefined}
          readOnly={false}
          risk={risk}
          today={TODAY}
          onOpen={() => {}}
          onCycleStatus={() => {}}
        />,
      )
    }

    it('AC30.2 shows the due date when nothing is at risk', () => {
      renderWithRisk(makeTask({ dueDate: '2026-10-23', dueTime: '17:00' }))
      expect(screen.getByText('Due Fri, Oct 23, 5:00 PM')).toBeInTheDocument()
      expect(
        screen.getByRole('article', { name: 'Client call, To Do, due Friday, October 23 at 5:00 PM' }),
      ).toBeInTheDocument()
    })

    it('AC31.2 Overdue replaces the due text and is part of the label (AC31.4)', () => {
      const { container } = renderWithRisk(makeTask({ dueDate: '2026-10-20' }), 'overdue')
      expect(screen.getByText('Overdue · due Oct 20')).toBeInTheDocument()
      expect(screen.queryByText(/^Due /)).not.toBeInTheDocument()
      expect(container.querySelectorAll('[data-risk]')).toHaveLength(1)
      expect(
        screen.getByRole('article', { name: 'Client call, To Do, overdue, due October 20' }),
      ).toBeInTheDocument()
    })

    it('Stuck replaces the carried-over marker, so the count shows once', () => {
      renderWithRisk(makeTask({ carriedOverCount: 4 }), 'stuck')
      expect(screen.getByText('Stuck · carried over ×4')).toBeInTheDocument()
      expect(screen.queryByText('Carried over ×4')).not.toBeInTheDocument()
      expect(
        screen.getByRole('article', { name: 'Client call, To Do, stuck, carried over 4 times' }),
      ).toBeInTheDocument()
    })

    it('a timing marker keeps the due text for a later due date', () => {
      renderWithRisk(makeTask({ startTime: '10:00', dueDate: '2026-10-23' }), 'running_late')
      expect(screen.getByText('Running late · 10:00 AM')).toBeInTheDocument()
      expect(screen.getByText('Due Fri, Oct 23')).toBeInTheDocument()
    })
  })
})
