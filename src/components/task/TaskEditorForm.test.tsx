import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { TaskFormValues } from '@/schemas/taskForm'
import { makeCompany } from '@/test/factories'
import { emptyTaskForm } from '@/utils/taskFormMapping'
import { TaskEditorForm } from './TaskEditorForm'

function renderForm(
  onSubmit = vi.fn<(values: TaskFormValues) => Promise<void>>().mockResolvedValue(undefined),
) {
  render(
    <TaskEditorForm
      defaultValues={emptyTaskForm('morning')}
      companies={[makeCompany()]}
      isEdit={false}
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
})
