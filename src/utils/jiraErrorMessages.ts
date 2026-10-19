import { JiraError } from '@/services/jira/jiraClient'
import { VaultLockedError } from '@/services/crypto/errors'

/** User-facing copy for Jira failures (design spec Section 8, D7 and the Jira card). */
export function jiraErrorMessage(
  error: unknown,
  context: { key?: string; site?: string | null } = {},
): string {
  if (error instanceof VaultLockedError) return 'Unlock your keys to use Jira.'
  if (!(error instanceof JiraError)) return 'Something went wrong with Jira. Try again.'
  switch (error.kind) {
    case 'not-configured':
      return 'Connect Jira in Settings first.'
    case 'rejected-token':
      return 'Jira rejected this token. Check the email and token.'
    case 'no-access':
      return 'Your Jira token doesn’t have access to this issue.'
    case 'not-found':
      return context.key
        ? `We couldn’t find ${context.key} on ${context.site ?? 'your Jira site'}. Check the key.`
        : 'Enter an issue key like ABC-123, or paste a link to the issue.'
    case 'rate-limit':
      return 'Jira is busy. Try again in a minute.'
    case 'offline':
      return 'You’re offline. Link the issue when you’re back online.'
    case 'unreachable':
      return 'Couldn’t reach Jira. Check your connection and try again.'
    default:
      return 'Jira returned an error. Try again.'
  }
}
