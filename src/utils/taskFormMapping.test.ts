import { describe, expect, it } from 'vitest'
import { NO_COMPANY } from '@/schemas/taskForm'
import { makeTask } from '@/test/factories'
import type { RecurringSeries } from '@/types/recurring'
import { emptyTaskForm, formToNewTask, formToPatch, formToPattern, taskToForm } from './taskFormMapping'

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
      dueDate: null,
      dueTime: null,
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
      dueDate: null,
      dueTime: null,
    })
  })

  it('maps "No company" to null', () => {
    expect(taskToForm(makeTask()).companyId).toBe(NO_COMPANY)
    expect(formToPatch({ ...emptyTaskForm('evening'), title: 'x' }).companyId).toBeNull()
  })

  describe('Due date (PRD FR30)', () => {
    it('round-trips a due date and time', () => {
      const values = taskToForm(makeTask({ dueDate: '2026-10-24', dueTime: '17:00' }))
      expect(values).toMatchObject({ dueDate: '2026-10-24', dueTime: '17:00' })
      expect(formToPatch(values)).toMatchObject({ dueDate: '2026-10-24', dueTime: '17:00' })
    })

    it('AC30.5 drops the due date when the task repeats', () => {
      const values = {
        ...emptyTaskForm('morning'),
        title: 'Standup',
        repeat: 'daily' as const,
        dueDate: '2026-10-24',
      }
      expect(formToPatch(values)).toMatchObject({ dueDate: null, dueTime: null })
    })

    it('AC30.4 an empty date clears the time too', () => {
      const values = { ...emptyTaskForm('morning'), title: 'A', dueDate: '', dueTime: '17:00' }
      expect(formToPatch(values)).toMatchObject({ dueDate: null, dueTime: null })
    })
  })

  describe('Repeat (PRD AC20.1, design F14.2)', () => {
    it('defaults to Doesn’t repeat, with the day’s weekday and date preselected', () => {
      // 2026-10-21 is a Wednesday.
      expect(emptyTaskForm('morning', '2026-10-21')).toMatchObject({
        repeat: 'none',
        repeatWeekdays: [3],
        repeatDay: '21',
      })
      expect(formToPattern(emptyTaskForm('morning', '2026-10-21'))).toBeNull()
    })

    it('maps each choice to a pattern', () => {
      const base = emptyTaskForm('morning', '2026-10-21')
      expect(formToPattern({ ...base, repeat: 'daily' })).toEqual({ kind: 'daily' })
      expect(formToPattern({ ...base, repeat: 'working_days' })).toEqual({ kind: 'working_days' })
      expect(formToPattern({ ...base, repeat: 'weekly', repeatWeekdays: [5, 1] })).toEqual({
        kind: 'weekly',
        weekdays: [1, 5],
      })
      expect(formToPattern({ ...base, repeat: 'monthly', repeatDay: '31' })).toEqual({
        kind: 'monthly',
        dayOfMonth: 31,
      })
    })

    it('shows a repeating task’s pattern', () => {
      const series = { pattern: { kind: 'monthly', dayOfMonth: 30 } } as RecurringSeries
      expect(taskToForm(makeTask({ dayKey: '2026-10-21' }), series)).toMatchObject({
        repeat: 'monthly',
        repeatDay: '30',
      })
    })
  })
})
