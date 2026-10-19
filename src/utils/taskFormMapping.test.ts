import { describe, expect, it } from 'vitest'
import { NO_COMPANY } from '@/schemas/taskForm'
import { makeTask } from '@/test/factories'
import { emptyTaskForm, formToNewTask, formToPatch, taskToForm } from './taskFormMapping'

describe('taskFormMapping', () => {
  it('turns empty optional fields into null', () => {
    const values = { ...emptyTaskForm('morning'), title: 'Write report' }
    expect(formToNewTask(values, '2026-10-19')).toEqual({
      title: 'Write report',
      dayKey: '2026-10-19',
      block: 'morning',
      companyId: null,
      startTime: null,
      durationMinutes: null,
      notes: '',
      jiraIssue: null,
    })
  })

  it('round-trips a task through the form', () => {
    const task = makeTask({ companyId: 'acme', startTime: '14:00', durationMinutes: 45, notes: 'Agenda' })
    const values = taskToForm(task)
    expect(values).toMatchObject({ companyId: 'acme', startTime: '14:00', durationMinutes: '45' })
    expect(formToPatch(values)).toEqual({
      title: 'Client call',
      companyId: 'acme',
      startTime: '14:00',
      durationMinutes: 45,
      notes: 'Agenda',
      jiraIssue: null,
    })
  })

  it('maps "No company" to null', () => {
    expect(taskToForm(makeTask()).companyId).toBe(NO_COMPANY)
    expect(formToPatch({ ...emptyTaskForm('evening'), title: 'x' }).companyId).toBeNull()
  })
})
