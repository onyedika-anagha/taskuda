import { updateTask } from '@/services/db/taskRepository'
import type { Task, TaskStatus } from '@/types/task'
import { JiraError, getIssue, parseIssueKey, transitionIssue, type JiraTarget } from './jiraClient'
import { getJiraCredentials, getJiraSettings } from './jiraSettings'

/** The connected site and its decrypted credentials. Throws `JiraError('not-configured')` if missing. */
export async function getJiraTarget(): Promise<JiraTarget> {
  const [settings, credentials] = await Promise.all([getJiraSettings(), getJiraCredentials()])
  if (!settings.site || !credentials) throw new JiraError('not-configured')
  return { site: settings.site, credentials }
}

/** D7 "Look up": the issue for a key or URL. */
export async function lookUpIssue(input: string) {
  const key = parseIssueKey(input)
  if (!key) throw new JiraError('not-found')
  return getIssue(await getJiraTarget(), key)
}

export type StatusSyncResult = 'updated' | 'no-mapping' | 'no-transition'

/**
 * AC15.3: after a linked task's status changes, move its issue to the mapped Jira status and
 * refresh the issue status shown on the note.
 */
export async function syncTaskStatusToJira(task: Task, status: TaskStatus): Promise<StatusSyncResult> {
  const issue = task.jiraIssue
  const { statusMap } = await getJiraSettings()
  const wanted = statusMap[status]
  if (!issue || !wanted) return 'no-mapping'
  if (issue.status.toLowerCase() === wanted.toLowerCase()) return 'updated'
  const target = await getJiraTarget()
  if (!(await transitionIssue(target, issue.key, wanted))) return 'no-transition'
  const fresh = await getIssue(target, issue.key)
  await updateTask(task.id, { jiraIssue: fresh })
  return 'updated'
}
