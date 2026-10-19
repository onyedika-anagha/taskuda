import { useMemo } from 'react'
import { toast } from 'sonner'
import { ValidationError } from '@/services/db/errors'
import * as tasks from '@/services/db/taskRepository'
import { announce } from '@/stores/announcerStore'
import { syncTaskStatusToJira } from '@/services/jira/jiraService'
import { cheer } from '@/services/voice/voiceAlerts'
import { jiraErrorMessage } from '@/utils/jiraErrorMessages'
import { useCanvasUiStore } from '@/stores/canvasUiStore'
import type { NewTaskInput, Task, TaskPatch, TaskStatus, TimeBlock } from '@/types/task'
import { BLOCK_LABELS } from '@/utils/taskPresentation'
import { STATUS_LABELS, nextStatus } from '@/utils/taskStatus'
import { isTimeInBlock } from '@/utils/timeBlocks'

/** AC15.3: move the linked issue to the mapped status; problems show as a toast, never block the task. */
async function pushStatusToJira(task: Task, status: TaskStatus): Promise<void> {
  const key = task.jiraIssue?.key
  try {
    const result = await syncTaskStatusToJira({ ...task, status }, status)
    if (result === 'no-transition') {
      toast(`${key} can’t move to that status from where it is in Jira. Update it in Jira.`)
    }
  } catch (error) {
    toast.error(`Couldn’t update ${key} in Jira.`, { description: jiraErrorMessage(error, { key }) })
  }
}

const GENERIC_SAVE_ERROR = 'Couldn’t save your change.'

function reportFailure(error: unknown, retry: () => void, message = GENERIC_SAVE_ERROR): void {
  const description = error instanceof ValidationError ? error.message : undefined
  toast.error(message, { description, action: { label: 'Try again', onClick: retry } })
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
    async function setStatus(task: Task, status: TaskStatus): Promise<void> {
      try {
        await tasks.setTaskStatus(task.id, status)
        announce(`${task.title}: ${STATUS_LABELS[status]}`)
        // Completion cheer (PRD AC9.2), only with voice on.
        if (status === 'done' && task.status !== 'done') void cheer()
        if (task.jiraIssue) void pushStatusToJira(task, status)
      } catch (error) {
        reportFailure(error, () => void setStatus(task, status))
      }
    }

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
          await tasks.deleteTask(task.id)
          toast.success('Task deleted')
        } catch (error) {
          reportFailure(error, () => void tasks.deleteTask(task.id))
        }
      },
    }
  }, [requestTimedMove])
}
