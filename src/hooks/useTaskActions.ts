import { createElement, useMemo } from 'react'
import { toast } from 'sonner'
import { UndoToast } from '@/components/common/UndoToast'
import * as tasks from '@/services/db/taskRepository'
import { changeTaskStatus, reportSaveFailure as reportFailure } from '@/services/tasks/taskStatusActions'
import { announce } from '@/stores/announcerStore'
import { useCanvasUiStore } from '@/stores/canvasUiStore'
import type { NewTaskInput, Task, TaskPatch, TaskStatus, TimeBlock } from '@/types/task'
import { BLOCK_LABELS } from '@/utils/taskPresentation'
import { nextStatus } from '@/utils/taskStatus'
import { isTimeInBlock } from '@/utils/timeBlocks'

/** `Infinity`: UndoToast closes itself when its own (pausable) timer runs out. */
function showUndoToast(message: string, onUndo: () => void): void {
  toast.custom((id) => createElement(UndoToast, { toastId: id, message, onUndo }), {
    duration: Infinity,
  })
}

export interface MoveOptions {
  /** User confirmed "Remove time and move" (design D2). */
  clearStartTime?: boolean
  /** Moves from the note menu get a confirmation toast; drags already show the result. */
  viaMenu?: boolean
}

export interface TaskActions {
  /** Rejects on failure so the editor can keep the user's input (design F2.5). */
  createTask: (input: NewTaskInput) => Promise<Task>
  /** Rejects on failure so the editor can keep the user's input. */
  saveTask: (task: Task, patch: TaskPatch, block: TimeBlock) => Promise<void>
  cycleStatus: (task: Task) => Promise<void>
  setStatus: (task: Task, status: TaskStatus) => Promise<void>
  /** Returns false when the move is waiting for the D2 confirmation. */
  moveTask: (task: Task, toBlock: TimeBlock, toIndex: number, options?: MoveOptions) => Promise<boolean>
  deleteTask: (task: Task) => Promise<void>
}

export function useTaskActions(): TaskActions {
  const requestTimedMove = useCanvasUiStore((s) => s.requestTimedMove)

  return useMemo<TaskActions>(() => {
    const setStatus = (task: Task, status: TaskStatus) => changeTaskStatus(task, status)

    async function moveTask(
      task: Task,
      toBlock: TimeBlock,
      toIndex: number,
      options: MoveOptions = {},
    ): Promise<boolean> {
      const timeConflict = task.startTime && !isTimeInBlock(task.startTime, toBlock)
      if (timeConflict && !options.clearStartTime) {
        requestTimedMove({ taskId: task.id, toBlock, toIndex })
        return false
      }
      try {
        await tasks.moveTask(task.id, toBlock, toIndex, { clearStartTime: options.clearStartTime })
        announce(`${task.title} moved to ${BLOCK_LABELS[toBlock]}, position ${toIndex + 1}`)
        if (options.viaMenu) toast.success('Task moved')
        return true
      } catch (error) {
        reportFailure(error, () => void moveTask(task, toBlock, toIndex, options))
        return false
      }
    }

    /** Undo for a delete (PRD FR18). */
    async function restore(deleted: tasks.DeletedTask): Promise<void> {
      try {
        await tasks.restoreTask(deleted)
        announce(`${deleted.task.title} restored`)
        toast.success('Task restored')
      } catch (error) {
        reportFailure(error, () => void restore(deleted), 'Couldn’t restore the task.')
      }
    }

    return {
      async createTask(input) {
        const task = await tasks.createTask(input)
        toast.success('Task added')
        return task
      },

      async saveTask(task, patch, block) {
        await tasks.updateTask(task.id, patch)
        if (block !== task.block) await tasks.moveTask(task.id, block, Number.MAX_SAFE_INTEGER)
        toast.success('Changes saved')
      },

      cycleStatus: (task) => setStatus(task, nextStatus(task.status)),
      setStatus,
      moveTask,

      async deleteTask(task) {
        try {
          const deleted = await tasks.deleteTask(task.id)
          announce('Task deleted. Undo available.')
          showUndoToast('Task deleted', () => void restore(deleted))
        } catch (error) {
          reportFailure(error, () => void tasks.deleteTask(task.id))
        }
      },
    }
  }, [requestTimedMove])
}
