import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { useTaskActions } from '@/hooks/useTaskActions'
import { useCanvasUiStore } from '@/stores/canvasUiStore'
import type { Task } from '@/types/task'
import { BLOCK_LABELS, formatTime } from '@/utils/taskPresentation'
import { blockForTime } from '@/utils/timeBlocks'

/** D2: a task with a start time was moved to a block that doesn't contain that time. */
export function TimedTaskMoveDialog({ tasks }: { tasks: Task[] }) {
  const pending = useCanvasUiStore((s) => s.pendingTimedMove)
  const clearTimedMove = useCanvasUiStore((s) => s.clearTimedMove)
  const actions = useTaskActions()
  const task = pending ? tasks.find((t) => t.id === pending.taskId) : undefined
  const startTime = task?.startTime

  return (
    <ConfirmDialog
      open={!!pending && !!startTime}
      title={pending ? `Move to ${BLOCK_LABELS[pending.toBlock]}?` : ''}
      description={
        startTime
          ? `This task starts at ${formatTime(startTime)}, which is in the ${BLOCK_LABELS[blockForTime(startTime)].toLowerCase()}.`
          : ''
      }
      confirmLabel="Remove time and move"
      onCancel={clearTimedMove}
      onConfirm={() => {
        if (task && pending)
          void actions.moveTask(task, pending.toBlock, pending.toIndex, { clearStartTime: true })
        clearTimedMove()
      }}
    />
  )
}
