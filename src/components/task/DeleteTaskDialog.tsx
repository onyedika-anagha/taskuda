import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { useTaskActions } from '@/hooks/useTaskActions'
import { useCanvasUiStore } from '@/stores/canvasUiStore'
import type { Task } from '@/types/task'

/** D1 Delete Task (PRD AC2.3). */
export function DeleteTaskDialog({ tasks }: { tasks: Task[] }) {
  const deleteTaskId = useCanvasUiStore((s) => s.deleteTaskId)
  const cancelDelete = useCanvasUiStore((s) => s.cancelDelete)
  const actions = useTaskActions()
  const task = tasks.find((t) => t.id === deleteTaskId)

  return (
    <ConfirmDialog
      open={!!task}
      title="Delete this task?"
      description="It will be removed from today and from your report."
      confirmLabel="Delete"
      destructive
      onCancel={cancelDelete}
      onConfirm={() => {
        if (task) void actions.deleteTask(task)
        cancelDelete()
      }}
    />
  )
}
