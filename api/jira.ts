import { RateLimiter, handleJiraProxy } from '../server/jiraProxy.ts'

/** Vercel Function: POST /api/jira. All rules live in server/jiraProxy.ts. */
const limiter = new RateLimiter()

export function POST(request: Request): Promise<Response> {
  return handleJiraProxy(request, { allowedOrigin: process.env.ALLOWED_ORIGIN }, limiter)
}
