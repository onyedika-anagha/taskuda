export const TIME_BLOCKS = ['morning', 'afternoon', 'evening'] as const
export type TimeBlock = (typeof TIME_BLOCKS)[number]

export const TASK_STATUSES = ['todo', 'in_progress', 'done'] as const
export type TaskStatus = (typeof TASK_STATUSES)[number]

/** Where a task came from. Calendar-sourced tasks show a calendar icon. */
export type TaskSource = 'manual' | 'calendar'

export interface JiraIssueLink {
  key: string
  title: string
  status: string
}

export interface Task {
  id: string
  title: string
  notes: string
  companyId: string | null
  /** Local calendar day, `yyyy-MM-dd`. */
  dayKey: string
  block: TimeBlock
  /** Position within the block; lower comes first. */
  order: number
  /** Local time, `HH:mm`. */
  startTime: string | null
  durationMinutes: number | null
  status: TaskStatus
  /** How many times this task (or the task it was copied from) has been carried over. */
  carriedOverCount: number
  /** Set on the copy created by carryover. */
  carriedFromTaskId: string | null
  /** Set on the original once it has been carried to the next day. */
  carriedToTaskId: string | null
  source: TaskSource
  jiraIssue: JiraIssueLink | null
  createdAt: number
  updatedAt: number
}

export interface NewTaskInput {
  title: string
  dayKey: string
  block: TimeBlock
  notes?: string
  companyId?: string | null
  startTime?: string | null
  durationMinutes?: number | null
  source?: TaskSource
  jiraIssue?: JiraIssueLink | null
}

export type TaskPatch = Partial<
  Pick<Task, 'title' | 'notes' | 'companyId' | 'startTime' | 'durationMinutes' | 'jiraIssue'>
>
