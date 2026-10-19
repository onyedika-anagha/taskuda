import type { TaskStatus } from './task'

export interface JiraCredentials {
  email: string
  token: string
}

/** Which Jira status a linked issue moves to when the task's status changes (PRD AC15.3). */
export type JiraStatusMap = Partial<Record<TaskStatus, string>>

export type JiraErrorKind =
  | 'not-configured'
  | 'rejected-token'
  | 'no-access'
  | 'not-found'
  | 'rate-limit'
  | 'offline'
  | 'unreachable'
  | 'other'
