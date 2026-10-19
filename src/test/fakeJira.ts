import { jsonResponse, mockFetch } from './mockFetch'

interface FakeIssue {
  key: string
  summary: string
  status: string
}

/** Workflow: which statuses each status can move to. */
const WORKFLOW: Record<string, string[]> = {
  'To Do': ['In Progress'],
  'In Progress': ['To Do', 'In Review', 'Done'],
  'In Review': ['In Progress', 'Done'],
  Done: ['To Do'],
}

export const FAKE_JIRA_AUTH = `Basic ${btoa('me@example.com:good-token')}`

/** A Jira Cloud site behind the mocked `/api/jira` proxy. Checks credentials like Jira would. */
export function installFakeJira() {
  const issues = new Map<string, FakeIssue>([
    ['ACM-12', { key: 'ACM-12', summary: 'Fix login bug', status: 'To Do' }],
    ['ACM-13', { key: 'ACM-13', summary: 'Secret project', status: 'To Do' }],
  ])
  const { requests } = mockFetch(async (request) => {
    if (request.url !== '/api/jira') return jsonResponse({}, 404)
    if (request.headers.authorization !== FAKE_JIRA_AUTH) return jsonResponse({}, 401)
    const { site, path, method, body } = request.body as {
      site: string
      path: string
      method: string
      body?: { transition: { id: string } }
    }
    if (site !== 'acme.atlassian.net') return jsonResponse({}, 404)
    if (path === '/rest/api/3/myself') return jsonResponse({ displayName: 'Ada Lovelace' })
    if (path === '/rest/api/3/status') {
      return jsonResponse(Object.keys(WORKFLOW).map((name, i) => ({ id: String(i), name })))
    }
    const match = /^\/rest\/api\/3\/issue\/([A-Z0-9_]+-\d+)(\/transitions)?/.exec(path)
    const issue = match ? issues.get(match[1]) : undefined
    if (!issue) return jsonResponse({}, 404)
    if (issue.key === 'ACM-13') return jsonResponse({}, 403)
    if (!match?.[2]) {
      return jsonResponse({
        key: issue.key,
        fields: { summary: issue.summary, status: { name: issue.status } },
      })
    }
    const transitions = WORKFLOW[issue.status].map((to) => ({ id: `to-${to}`, to: { name: to } }))
    if (method === 'GET') return jsonResponse({ transitions })
    const chosen = transitions.find((t) => t.id === body?.transition.id)
    if (!chosen) return jsonResponse({}, 400)
    issue.status = chosen.to.name
    return new Response(null, { status: 204 })
  })
  return { issues, requests }
}
