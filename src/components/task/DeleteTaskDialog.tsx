import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { useSeries } from '@/hooks/useSeries'
import { useSeriesActions } from '@/hooks/useSeriesActions'
import { useTaskActions } from '@/hooks/useTaskActions'
import { useCanvasUiStore } from '@/stores/canvasUiStore'
import type { Task } from '@/types/task'
import { RepeatScopeDialog } from './RepeatScopeDialog'

/** D1 Delete Task (PRD AC2.3), with the repeating variant (AC20.5). */
export function DeleteTaskDialog({ tasks }: { tasks: Task[] }) {
  const deleteTaskId = useCanvasUiStore((s) => s.deleteTaskId)
  const cancelDelete = useCanvasUiStore((s) => s.cancelDelete)
  const actions = useTaskActions()
  const seriesActions = useSeriesActions()
  const task = tasks.find((t) => t.id === deleteTaskId)
  const series = useSeries(task?.seriesId)
  const repeating = !!task?.seriesId && !!series

  if (repeating) {
    return (
      <RepeatScopeDialog
        open
        title="Delete repeating task?"
        description="Delete only this one, or this one and all future ones? Past days aren’t changed."
        destructive
        onChoose={(scope) => {
          void seriesActions.deleteOccurrence(task, scope)
          cancelDelete()
        }}
        onCancel={cancelDelete}
      />
    )
  }

  return (
    <ConfirmDialog
      // While a repeating task's series loads, wait instead of showing the plain variant.
      open={!!task && (!task.seriesId || series === null)}
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
