import { useState } from 'react'
import { toast } from 'sonner'
import { ResponsiveDialog } from '@/components/common/ResponsiveDialog'
import { useCompanies } from '@/hooks/useCompanies'
import { useSeries } from '@/hooks/useSeries'
import { useSeriesActions, type TaskChanges } from '@/hooks/useSeriesActions'
import { ValidationError } from '@/services/db/errors'
import type { RepeatScope } from '@/services/db/seriesRepository'
import { useCanvasUiStore } from '@/stores/canvasUiStore'
import type { TaskFormValues } from '@/schemas/taskForm'
import type { Task } from '@/types/task'
import { samePattern } from '@/utils/recurrence'
import { emptyTaskForm, formToNewTask, formToPatch, formToPattern, taskToForm } from '@/utils/taskFormMapping'
import { RepeatScopeDialog } from './RepeatScopeDialog'
import { TaskEditorForm } from './TaskEditorForm'

interface TaskEditorProps {
  dayKey: string
  tasks: Task[]
}

function changesOf(values: TaskFormValues): TaskChanges {
  return { patch: formToPatch(values), block: values.block, pattern: formToPattern(values) }
}

/** S3 Task Editor: create or edit a task on the shown day, with Repeat (PRD FR20). */
export function TaskEditor({ dayKey, tasks }: TaskEditorProps) {
  const editor = useCanvasUiStore((s) => s.editor)
  const closeEditor = useCanvasUiStore((s) => s.closeEditor)
  const requestDelete = useCanvasUiStore((s) => s.requestDelete)
  const { companies } = useCompanies()
  const actions = useSeriesActions()
  /** Values waiting on D8 "Change repeating task?". */
  const [pending, setPending] = useState<TaskFormValues | null>(null)

  const task = editor.mode === 'edit' ? tasks.find((t) => t.id === editor.taskId) : undefined
  const series = useSeries(task?.seriesId)
  const open = editor.mode === 'create' || (editor.mode === 'edit' && !!task)

  async function save(values: TaskFormValues, scope: RepeatScope) {
    try {
      if (task) await actions.saveTask(task, changesOf(values), scope)
      else await actions.createTask(formToNewTask(values, dayKey), formToPattern(values))
      closeEditor()
    } catch (error) {
      // Keep the dialog open with the user's input (design F2.5).
      toast.error('Couldn’t save this task. Your input is still here.', {
        description: error instanceof ValidationError ? error.message : undefined,
        action: { label: 'Try again', onClick: () => void save(values, scope) },
      })
    }
  }

  async function onSubmit(values: TaskFormValues) {
    if (!task?.seriesId || !series) return save(values, 'this')
    // A new Repeat choice always applies from this task on; there's nothing to ask (design note).
    if (!samePattern(formToPattern(values), series.pattern)) return save(values, 'future')
    // Nothing changed: no need to ask which tasks to change.
    if (JSON.stringify(values) === JSON.stringify(taskToForm(task, series))) return save(values, 'this')
    setPending(values)
  }

  // Wait for the series, so Repeat shows the right choice from the start.
  const ready = !task?.seriesId || series !== undefined
  const defaultValues = task
    ? taskToForm(task, series ?? undefined)
    : emptyTaskForm(editor.mode === 'create' ? editor.defaultBlock : 'morning', dayKey)

  return (
    <>
      <ResponsiveDialog
        open={open}
        onOpenChange={(next) => !next && closeEditor()}
        title={task ? 'Edit task' : 'New task'}
      >
        {open && ready ? (
          <TaskEditorForm
            key={task?.id ?? 'new'}
            defaultValues={defaultValues}
            companies={companies ?? []}
            isEdit={!!task}
            dayTasks={tasks}
            editing={task}
            onSubmit={onSubmit}
            onCancel={closeEditor}
            onDelete={
              task
                ? () => {
                    closeEditor()
                    requestDelete(task.id)
                  }
                : undefined
            }
          />
        ) : null}
      </ResponsiveDialog>
      <RepeatScopeDialog
        open={pending !== null}
        title="Change repeating task?"
        description="Apply your changes to this task only, or to this and all future ones? Past days aren’t changed."
        onChoose={(scope) => {
          if (pending) void save(pending, scope)
          setPending(null)
        }}
        // Cancel keeps the editor open with the changes (design D8).
        onCancel={() => setPending(null)}
      />
    </>
  )
}
