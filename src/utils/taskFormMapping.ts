import { NO_COMPANY, type TaskFormValues } from '@/schemas/taskForm'
import type { NewTaskInput, Task, TaskPatch, TimeBlock } from '@/types/task'

export function emptyTaskForm(block: TimeBlock): TaskFormValues {
  return { title: '', companyId: NO_COMPANY, block, startTime: '', durationMinutes: '', notes: '' }
}

export function taskToForm(task: Task): TaskFormValues {
  return {
    title: task.title,
    companyId: task.companyId ?? NO_COMPANY,
    block: task.block,
    startTime: task.startTime ?? '',
    durationMinutes: task.durationMinutes ? String(task.durationMinutes) : '',
    notes: task.notes,
  }
}

export function formToPatch(values: TaskFormValues): TaskPatch {
  return {
    title: values.title,
    companyId: values.companyId === NO_COMPANY ? null : values.companyId,
    startTime: values.startTime || null,
    durationMinutes: values.durationMinutes ? Number(values.durationMinutes) : null,
    notes: values.notes,
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
  }
}
