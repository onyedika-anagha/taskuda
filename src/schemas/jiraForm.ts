import { z } from 'zod'
import { normalizeSite } from '@/services/jira/jiraSettings'

/** Jira card connect form (design S7b). */
export const jiraConnectSchema = z.object({
  site: z
    .string()
    .trim()
    .min(1, 'Enter your Jira site.')
    .refine((v) => normalizeSite(v) !== null, 'Use your Jira Cloud address, like yoursite.atlassian.net.'),
  email: z.string().trim().email('Enter the email you sign in to Jira with.'),
  token: z.string().trim().min(1, 'Paste your API token.'),
})

export type JiraConnectValues = z.infer<typeof jiraConnectSchema>

export const linkIssueSchema = z.object({
  issue: z.string().trim().min(1, 'Enter an issue key like ABC-123, or paste a link to the issue.'),
})

export type LinkIssueValues = z.infer<typeof linkIssueSchema>
