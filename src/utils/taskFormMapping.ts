import { getDate, getDay } from 'date-fns'
import { NO_COMPANY, type TaskFormValues } from '@/schemas/taskForm'
import type { RecurringSeries, RepeatPattern } from '@/types/recurring'
import type { NewTaskInput, Task, TaskPatch, TimeBlock } from '@/types/task'
import type { Weekday } from '@/types/workday'
import { fromDayKey, todayKey } from './dates'

/** Weekly preselects the task's own weekday, Monthly its date (design F14.2). */
function repeatDefaults(dayKey: string): Pick<TaskFormValues, 'repeat' | 'repeatWeekdays' | 'repeatDay'> {
  const date = fromDayKey(dayKey)
  return { repeat: 'none', repeatWeekdays: [getDay(date)], repeatDay: String(getDate(date)) }
}

function repeatFields(pattern: RepeatPattern, dayKey: string) {
  const defaults = repeatDefaults(dayKey)
  switch (pattern.kind) {
    case 'weekly':
      return { ...defaults, repeat: pattern.kind, repeatWeekdays: [...pattern.weekdays] }
    case 'monthly':
      return { ...defaults, repeat: pattern.kind, repeatDay: String(pattern.dayOfMonth) }
    default:
      return { ...defaults, repeat: pattern.kind }
  }
}

export function emptyTaskForm(block: TimeBlock, dayKey = todayKey()): TaskFormValues {
  return {
    title: '',
    companyId: NO_COMPANY,
    block,
    startTime: '',
    durationMinutes: '',
    notes: '',
    jiraIssue: null,
    dueDate: '',
    dueTime: '',
    ...repeatDefaults(dayKey),
  }
}

/** `series`: the task's series, if it repeats. */
export function taskToForm(task: Task, series?: RecurringSeries): TaskFormValues {
  return {
    title: task.title,
    companyId: task.companyId ?? NO_COMPANY,
    block: task.block,
    startTime: task.startTime ?? '',
    durationMinutes: task.durationMinutes ? String(task.durationMinutes) : '',
    notes: task.notes,
    jiraIssue: task.jiraIssue,
    dueDate: task.dueDate ?? '',
    dueTime: task.dueTime ?? '',
    ...(series ? repeatFields(series.pattern, task.dayKey) : repeatDefaults(task.dayKey)),
  }
}

/** The Repeat choice as a pattern; `null` for "Doesn't repeat". */
export function formToPattern(values: TaskFormValues): RepeatPattern | null {
  switch (values.repeat) {
    case 'none':
      return null
    case 'weekly':
      return { kind: 'weekly', weekdays: [...values.repeatWeekdays].sort() as Weekday[] }
    case 'monthly':
      return { kind: 'monthly', dayOfMonth: Number(values.repeatDay) }
    default:
      return { kind: values.repeat }
  }
}

export function formToPatch(values: TaskFormValues): TaskPatch {
  // Repeating tasks never have a due date (PRD AC30.5), and a time needs a date (AC30.1).
  const dueDate = values.repeat === 'none' && values.dueDate ? values.dueDate : null
  return {
    title: values.title,
    companyId: values.companyId === NO_COMPANY ? null : values.companyId,
    startTime: values.startTime || null,
    durationMinutes: values.durationMinutes ? Number(values.durationMinutes) : null,
    notes: values.notes,
    jiraIssue: values.jiraIssue,
    dueDate,
    dueTime: dueDate && values.dueTime ? values.dueTime : null,
  }
}

export function formToNewTask(values: TaskFormValues, dayKey: string): NewTaskInput {
  const patch = formToPatch(values)
  return {
    title: values.title,
    dayKey,
    block: values.block,
    companyId: patch.companyId,
    startTime: patch.startTime,
    durationMinutes: patch.durationMinutes,
    notes: patch.notes,
    jiraIssue: patch.jiraIssue,
    dueDate: patch.dueDate,
    dueTime: patch.dueTime,
  }
}
