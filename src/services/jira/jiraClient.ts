import type { JiraCredentials, JiraErrorKind } from '@/types/jira'
import type { JiraIssueLink } from '@/types/task'

/** Same-origin proxy (api/jira.ts); browsers can't call Jira Cloud directly. */
const PROXY_URL = '/api/jira'

export class JiraError extends Error {
  readonly kind: JiraErrorKind

  constructor(kind: JiraErrorKind) {
    super(`Jira request failed: ${kind}`)
    this.name = 'JiraError'
    this.kind = kind
  }
}

function kindForStatus(status: number): JiraErrorKind {
  if (status === 401) return 'rejected-token'
  if (status === 403) return 'no-access'
  if (status === 404) return 'not-found'
  if (status === 429) return 'rate-limit'
  if (status === 502 || status === 503 || status === 504) return 'unreachable'
  return 'other'
}

export interface JiraTarget {
  site: string
  credentials: JiraCredentials
}

async function jiraRequest<T>(
  target: JiraTarget,
  path: string,
  method: 'GET' | 'POST' = 'GET',
  body?: unknown,
): Promise<T> {
  if (!navigator.onLine) throw new JiraError('offline')
  const authorization = `Basic ${btoa(`${target.credentials.email}:${target.credentials.token}`)}`
  let response: Response
  try {
    response = await fetch(PROXY_URL, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { Authorization: authorization, 'Content-Type': 'application/json' },
      body: JSON.stringify({ site: target.site, path, method, body }),
    })
  } catch {
    throw new JiraError('unreachable')
  }
  if (!response.ok) throw new JiraError(kindForStatus(response.status))
  const text = await response.text()
  return (text ? JSON.parse(text) : null) as T
}

/** `ABC-123`, `abc-123` or a Jira URL (…/browse/ABC-123) → `ABC-123`; `null` if there's no key. */
export function parseIssueKey(input: string): string | null {
  const match = /([A-Za-z][A-Za-z0-9_]{0,19}-\d{1,9})(?!.*[A-Za-z][A-Za-z0-9_]*-\d)/.exec(input.trim())
  return match ? match[1].toUpperCase() : null
}

/** "Test connection": returns the account's display name. */
export async function testJiraConnection(target: JiraTarget): Promise<string> {
  const me = await jiraRequest<{ displayName?: string; emailAddress?: string }>(target, '/rest/api/3/myself')
  return me.displayName || me.emailAddress || target.credentials.email
}

export async function getIssue(target: JiraTarget, key: string): Promise<JiraIssueLink> {
  const issue = await jiraRequest<{ key: string; fields?: { summary?: string; status?: { name?: string } } }>(
    target,
    `/rest/api/3/issue/${key}?fields=summary,status`,
  )
  return {
    key: issue.key,
    title: issue.fields?.summary ?? key,
    status: issue.fields?.status?.name ?? 'Unknown',
  }
}

/** Status names on the site, for the mapping selects. */
export async function listStatuses(target: JiraTarget): Promise<string[]> {
  const statuses = await jiraRequest<{ name?: string }[]>(target, '/rest/api/3/status')
  return [...new Set(statuses.map((s) => s.name).filter((n): n is string => !!n))].sort((a, b) =>
    a.localeCompare(b),
  )
}

/**
 * Moves an issue to the status named `statusName` using one of its available transitions.
 * Returns false when the workflow has no transition to that status from where the issue is now.
 */
export async function transitionIssue(target: JiraTarget, key: string, statusName: string): Promise<boolean> {
  const { transitions } = await jiraRequest<{ transitions: { id: string; to?: { name?: string } }[] }>(
    target,
    `/rest/api/3/issue/${key}/transitions`,
  )
  const wanted = statusName.toLowerCase()
  const transition = transitions.find((t) => t.to?.name?.toLowerCase() === wanted)
  if (!transition) return false
  await jiraRequest(target, `/rest/api/3/issue/${key}/transitions`, 'POST', {
    transition: { id: transition.id },
  })
  return true
}
