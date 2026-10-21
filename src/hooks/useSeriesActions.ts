import { useMemo } from 'react'
import { toast } from 'sonner'
import { showUndoToast } from '@/components/common/showUndoToast'
import * as series from '@/services/db/seriesRepository'
import * as tasks from '@/services/db/taskRepository'
import { reportSaveFailure } from '@/services/tasks/taskStatusActions'
import { announce } from '@/stores/announcerStore'
import type { RepeatPattern } from '@/types/recurring'
import type { NewTaskInput, Task, TaskPatch, TimeBlock } from '@/types/task'

export interface TaskChanges {
  patch: TaskPatch
  block: TimeBlock
  /** `null`: Doesn't repeat. */
  pattern: RepeatPattern | null
}

export interface SeriesActions {
  /** Rejects on failure so the editor can keep the user's input. */
  createTask: (input: NewTaskInput, pattern: RepeatPattern | null) => Promise<void>
  /**
   * Saves an edit. `scope` "future" (or a changed Repeat) changes the series from this day on;
   * otherwise only this task changes, and a task that didn't repeat starts a series when Repeat is set.
   * Rejects on failure so the editor can keep the user's input.
   */
  saveTask: (task: Task, changes: TaskChanges, scope: series.RepeatScope) => Promise<void>
  /** D1 repeating variant, with Undo that also brings the series back (FR18). */
  deleteOccurrence: (task: Task, scope: series.RepeatScope) => Promise<void>
}

/** Task saves and deletes that know about repeating series (PRD FR20). */
export function useSeriesActions(): SeriesActions {
  return useMemo<SeriesActions>(() => {
    async function restore(deleted: series.DeletedOccurrences): Promise<void> {
      try {
        await series.restoreOccurrences(deleted)
        announce(`${deleted.deleted[0]?.task.title ?? 'Task'} restored`)
        toast.success('Task restored')
      } catch (error) {
        reportSaveFailure(error, () => void restore(deleted), 'Couldn’t restore the task.')
      }
    }

    return {
      async createTask(input, pattern) {
        const task = await tasks.createTask(input)
        if (pattern) await series.startSeries(task.id, pattern)
        toast.success('Task added')
      },

      async saveTask(task, { patch, block, pattern }, scope) {
        if (task.seriesId && scope === 'future') {
          await series.changeSeriesFrom(task, patch, block, pattern)
        } else {
          await tasks.updateTask(task.id, patch)
          if (!task.seriesId && pattern) await series.startSeries(task.id, pattern)
        }
        if (block !== task.block) await tasks.moveTask(task.id, block, Number.MAX_SAFE_INTEGER)
        toast.success('Changes saved')
      },

      async deleteOccurrence(task, scope) {
        try {
          const deleted = await series.deleteOccurrence(task, scope)
          announce('Task deleted. Undo available.')
          showUndoToast(
            scope === 'future' ? 'Repeating task deleted' : 'Task deleted',
            () => void restore(deleted),
          )
        } catch (error) {
          reportSaveFailure(error, () => void series.deleteOccurrence(task, scope))
        }
      },
    }
  }, [])
}
