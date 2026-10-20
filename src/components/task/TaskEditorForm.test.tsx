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
})
