import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { TaskFormValues } from '@/schemas/taskForm'
import { makeCompany, makeTask } from '@/test/factories'
import type { Task } from '@/types/task'
import { emptyTaskForm } from '@/utils/taskFormMapping'
import { TaskEditorForm } from './TaskEditorForm'

function renderForm(
  onSubmit = vi.fn<(values: TaskFormValues) => Promise<void>>().mockResolvedValue(undefined),
  dayTasks: Task[] = [],
) {
  render(
    <TaskEditorForm
      defaultValues={emptyTaskForm('morning')}
      companies={[makeCompany()]}
      isEdit={false}
      dayTasks={dayTasks}
      onSubmit={onSubmit}
      onCancel={() => {}}
    />,
  )
  return onSubmit
}

describe('TaskEditorForm', () => {
  it('DAC1 saves a title-only task with Enter', async () => {
    const onSubmit = renderForm()
    await userEvent.type(screen.getByLabelText('Title'), 'Write report{Enter}')
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Write report', block: 'morning' }),
      expect.anything(),
    )
  })

  it('AC2.1 / DAC6 shows the title error on submit, not while typing', async () => {
    const onSubmit = renderForm()
    const title = screen.getByLabelText('Title')
    await userEvent.type(title, 'a')
    expect(screen.queryByText('Give the task a title.')).not.toBeInTheDocument()
    await userEvent.clear(title)
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Give the task a title.')).toBeInTheDocument()
    expect(title).toHaveAttribute('aria-invalid', 'true')
    expect(title).toHaveAccessibleDescription('Give the task a title.')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('DAC6 validates a field on blur', async () => {
    renderForm()
    await userEvent.type(screen.getByLabelText('Duration in minutes (optional)'), 'abc')
    expect(screen.queryByText('Enter the duration in whole minutes.')).not.toBeInTheDocument()
    await userEvent.tab()
    expect(await screen.findByText('Enter the duration in whole minutes.')).toBeInTheDocument()
  })

  it('F2.4 setting a start time moves the task to the matching block', async () => {
    const onSubmit = renderForm()
    await userEvent.type(screen.getByLabelText('Title'), 'Client call')
    await userEvent.type(screen.getByLabelText('Start time (optional)'), '14:00')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ startTime: '14:00', block: 'afternoon' }),
      expect.anything(),
    )
  })

  it('has a visible label for every field', () => {
    renderForm()
    for (const label of [
      'Title',
      'Company',
      'Time of day',
      'Start time (optional)',
      'Duration in minutes (optional)',
      'Notes (optional)',
    ]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument()
    }
  })

  describe('overlap warning (PRD AC25.3)', () => {
    const call = makeTask({ id: 'call', title: 'Client call', startTime: '14:00', durationMinutes: null })

    it('warns under Duration when the time overlaps, and still saves', async () => {
      const onSubmit = renderForm(undefined, [call])
      await userEvent.type(screen.getByLabelText('Title'), 'Standup')
      await userEvent.type(screen.getByLabelText('Start time (optional)'), '14:15')
      const warning = screen.getByText('Overlaps with Client call (2:00–2:30 PM). You can still save.')
      expect(screen.getByLabelText('Duration in minutes (optional)')).toHaveAttribute(
        'aria-describedby',
        warning.id,
      )
      await userEvent.click(screen.getByRole('button', { name: 'Save' }))
      expect(onSubmit).toHaveBeenCalled()
    })

    it('clears when the duration no longer reaches the other task', async () => {
      renderForm(undefined, [call])
      await userEvent.type(screen.getByLabelText('Start time (optional)'), '13:30')
      await userEvent.type(screen.getByLabelText('Duration in minutes (optional)'), '45')
      expect(screen.getByText(/^Overlaps with Client call/)).toBeInTheDocument()
      await userEvent.clear(screen.getByLabelText('Duration in minutes (optional)'))
      await userEvent.type(screen.getByLabelText('Duration in minutes (optional)'), '30')
      expect(screen.queryByText(/^Overlaps with/)).not.toBeInTheDocument()
    })
  })

  describe('Repeat (PRD AC20.1, design F14)', () => {
    it('DAC17 Weekly preselects the task’s own weekday, so it saves in one extra choice', async () => {
      const onSubmit = renderForm()
      await userEvent.type(screen.getByLabelText('Title'), 'Client update')
      await userEvent.click(screen.getByRole('combobox', { name: 'Repeat' }))
      await userEvent.click(await screen.findByRole('option', { name: 'Weekly' }))
      const picker = screen.getByRole('group', { name: 'Repeat on' })
      const pressed = Array.from(picker.querySelectorAll('[aria-pressed="true"]'))
      expect(pressed).toHaveLength(1)
      await userEvent.click(screen.getByRole('button', { name: 'Save' }))
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ repeat: 'weekly', repeatWeekdays: [expect.any(Number)] }),
        expect.anything(),
      )
    })

    it('Monthly shows On day, with the short-month hint for 29–31', async () => {
      renderForm()
      await userEvent.click(screen.getByRole('combobox', { name: 'Repeat' }))
      await userEvent.click(await screen.findByRole('option', { name: 'Monthly' }))
      await userEvent.click(screen.getByRole('combobox', { name: 'On day' }))
      await userEvent.click(await screen.findByRole('option', { name: '31' }))
      expect(screen.getByText('In shorter months, it moves to the last day.')).toBeInTheDocument()
      await userEvent.click(screen.getByRole('combobox', { name: 'On day' }))
      await userEvent.click(await screen.findByRole('option', { name: '15' }))
      expect(screen.queryByText('In shorter months, it moves to the last day.')).not.toBeInTheDocument()
    })
  })

  describe('Due date (PRD FR30, design F18)', () => {
    it('DAC22 adds a due date in 2 interactions, with focus moving to the date', async () => {
      const onSubmit = renderForm()
      await userEvent.type(screen.getByLabelText('Title'), 'Invoice')
      await userEvent.click(screen.getByRole('button', { name: 'Add due date' }))
      const date = screen.getByLabelText('Due date')
      expect(date).toHaveFocus()
      await userEvent.type(date, '2099-10-24')
      await userEvent.click(screen.getByRole('button', { name: 'Save' }))
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ dueDate: '2099-10-24', dueTime: '' }),
        expect.anything(),
      )
    })

    it('AC30.4 Remove clears the date and time and returns focus to Add due date', async () => {
      const onSubmit = renderForm()
      await userEvent.type(screen.getByLabelText('Title'), 'Invoice')
      await userEvent.click(screen.getByRole('button', { name: 'Add due date' }))
      await userEvent.type(screen.getByLabelText('Due date'), '2099-10-24')
      await userEvent.type(screen.getByLabelText('Due time (optional)'), '17:00')
      await userEvent.click(screen.getByRole('button', { name: 'Remove due date' }))
      expect(screen.getByRole('button', { name: 'Add due date' })).toHaveFocus()
      await userEvent.click(screen.getByRole('button', { name: 'Save' }))
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ dueDate: '', dueTime: '' }),
        expect.anything(),
      )
    })

    it('AC30.3 a passed date shows a hint and still saves', async () => {
      const onSubmit = renderForm()
      await userEvent.type(screen.getByLabelText('Title'), 'Invoice')
      await userEvent.click(screen.getByRole('button', { name: 'Add due date' }))
      const date = screen.getByLabelText('Due date')
      await userEvent.type(date, '2020-01-01')
      expect(date).toHaveAccessibleDescription('This date has passed. The task will show as overdue.')
      await userEvent.click(screen.getByRole('button', { name: 'Save' }))
      expect(onSubmit).toHaveBeenCalled()
    })

    it('AC30.5 repeating tasks have no due date', async () => {
      renderForm()
      await userEvent.click(screen.getByRole('button', { name: 'Add due date' }))
      await userEvent.type(screen.getByLabelText('Due date'), '2099-10-24')
      await userEvent.click(screen.getByRole('combobox', { name: 'Repeat' }))
      await userEvent.click(await screen.findByRole('option', { name: 'Every day' }))
      expect(screen.queryByLabelText('Due date')).not.toBeInTheDocument()
      expect(screen.getByText('Due date removed. Repeating tasks don’t have due dates.')).toBeInTheDocument()
    })

    it('opens with the due date shown when the task has one', () => {
      render(
        <TaskEditorForm
          defaultValues={{ ...emptyTaskForm('morning'), title: 'Invoice', dueDate: '2099-10-24' }}
          companies={[]}
          isEdit
          onSubmit={vi.fn<(values: TaskFormValues) => Promise<void>>()}
          onCancel={() => {}}
        />,
      )
      expect(screen.getByLabelText('Due date')).toHaveValue('2099-10-24')
    })
  })
})
