import { toast } from 'sonner'
import { ResponsiveDialog } from '@/components/common/ResponsiveDialog'
import { useCompanies } from '@/hooks/useCompanies'
import { useTaskActions } from '@/hooks/useTaskActions'
import { ValidationError } from '@/services/db/errors'
import { useCanvasUiStore } from '@/stores/canvasUiStore'
import type { TaskFormValues } from '@/schemas/taskForm'
import type { Task } from '@/types/task'
import { emptyTaskForm, formToNewTask, formToPatch, taskToForm } from '@/utils/taskFormMapping'
import { blockForDate } from '@/utils/timeBlocks'
import { TaskEditorForm } from './TaskEditorForm'

interface TaskEditorProps {
  dayKey: string
  tasks: Task[]
}

/** S3 Task Editor: create or edit a task on the shown day. */
export function TaskEditor({ dayKey, tasks }: TaskEditorProps) {
  const editor = useCanvasUiStore((s) => s.editor)
  const closeEditor = useCanvasUiStore((s) => s.closeEditor)
  const requestDelete = useCanvasUiStore((s) => s.requestDelete)
  const { companies } = useCompanies()
  const actions = useTaskActions()

  const task = editor.mode === 'edit' ? tasks.find((t) => t.id === editor.taskId) : undefined
  const open = editor.mode === 'create' || (editor.mode === 'edit' && !!task)

  async function onSubmit(values: TaskFormValues) {
    try {
      if (task) await actions.saveTask(task, formToPatch(values), values.block)
      else await actions.createTask(formToNewTask(values, dayKey))
      closeEditor()
    } catch (error) {
      // Keep the dialog open with the user's input (design F2.5).
      toast.error('Couldn’t save this task. Your input is still here.', {
        description: error instanceof ValidationError ? error.message : undefined,
        action: { label: 'Try again', onClick: () => void onSubmit(values) },
      })
    }
  }

  const defaultValues = task
    ? taskToForm(task)
    : emptyTaskForm(
        editor.mode === 'create' && editor.defaultBlock ? editor.defaultBlock : blockForDate(new Date()),
      )

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(next) => !next && closeEditor()}
      title={task ? 'Edit task' : 'New task'}
    >
      {open ? (
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
  )
}
