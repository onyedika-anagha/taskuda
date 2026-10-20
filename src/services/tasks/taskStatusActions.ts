import { toast } from 'sonner'
import { ValidationError } from '@/services/db/errors'
import { setTaskStatus } from '@/services/db/taskRepository'
import { syncTaskStatusToJira } from '@/services/jira/jiraService'
import { cheer } from '@/services/voice/voiceAlerts'
import { announce } from '@/stores/announcerStore'
import type { Task, TaskStatus } from '@/types/task'
import { jiraErrorMessage } from '@/utils/jiraErrorMessages'
import { STATUS_LABELS } from '@/utils/taskStatus'

const GENERIC_SAVE_ERROR = 'Couldn’t save your change.'

/** Error toast with "Try again"; validation errors explain what was wrong. */
export function reportSaveFailure(error: unknown, retry: () => void, message = GENERIC_SAVE_ERROR): void {
  const description = error instanceof ValidationError ? error.message : undefined
  toast.error(message, { description, action: { label: 'Try again', onClick: retry } })
}

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

/**
 * Every way of changing a status goes through here (the note's toggle and menu, and a reminder's
 * Mark done, PRD AC22.3): saved with an activity entry, announced, cheered, and pushed to Jira.
 */
export async function changeTaskStatus(task: Task, status: TaskStatus): Promise<void> {
  try {
    await setTaskStatus(task.id, status)
    announce(`${task.title}: ${STATUS_LABELS[status]}`)
    // Completion cheer (PRD AC9.2), only with voice on.
    if (status === 'done' && task.status !== 'done') void cheer()
    if (task.jiraIssue) void pushStatusToJira(task, status)
  } catch (error) {
    reportSaveFailure(error, () => void changeTaskStatus(task, status))
  }
}
