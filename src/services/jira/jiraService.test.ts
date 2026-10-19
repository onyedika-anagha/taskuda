import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createVault } from '@/services/crypto/secretVault'
import { getSecret } from '@/services/crypto/secretVault'
import { createTask, getTask } from '@/services/db/taskRepository'
import { installFakeJira } from '@/test/fakeJira'
import { resetVaultState } from '@/test/resetVault'
import { JiraError, parseIssueKey, testJiraConnection } from './jiraClient'
import { lookUpIssue, syncTaskStatusToJira } from './jiraService'
import { normalizeSite, saveJiraConnection, setJiraStatusMap } from './jiraSettings'

const GOOD = { email: 'me@example.com', token: 'good-token' }

async function connect() {
  await createVault('correct horse battery')
  await saveJiraConnection('acme.atlassian.net', GOOD, 'Ada Lovelace')
}

describe('Jira client and service', () => {
  beforeEach(resetVaultState)
  afterEach(() => vi.restoreAllMocks())

  it.each([
    ['ACM-12', 'ACM-12'],
    ['  acm-12 ', 'ACM-12'],
    ['https://acme.atlassian.net/browse/ACM-12', 'ACM-12'],
    ['https://acme.atlassian.net/jira/software/projects/ACM/boards/1?selectedIssue=ACM-99', 'ACM-99'],
    ['not a key', null],
  ])('parses %s', (input, key) => {
    expect(parseIssueKey(input)).toBe(key)
  })

  it.each([
    ['acme', 'acme.atlassian.net'],
    ['https://Acme.atlassian.net/jira/your-work', 'acme.atlassian.net'],
    ['acme.example.com', null],
  ])('normalizes the site %s', (input, site) => {
    expect(normalizeSite(input)).toBe(site)
  })

  it('AC15.1 tests the connection through the proxy and stores the token encrypted', async () => {
    const { requests } = installFakeJira()
    expect(await testJiraConnection({ site: 'acme.atlassian.net', credentials: GOOD })).toBe('Ada Lovelace')
    expect(requests[0]).toMatchObject({ url: '/api/jira', method: 'POST' })
    expect(requests[0].body).toEqual({
      site: 'acme.atlassian.net',
      path: '/rest/api/3/myself',
      method: 'GET',
    })

    await connect()
    expect(JSON.parse((await getSecret('jira')) ?? '{}')).toEqual(GOOD)
  })

  it('a wrong token is reported as rejected', async () => {
    installFakeJira()
    await expect(
      testJiraConnection({ site: 'acme.atlassian.net', credentials: { ...GOOD, token: 'bad' } }),
    ).rejects.toMatchObject({ kind: 'rejected-token' })
  })

  it('AC15.2 looks up an issue by key or link', async () => {
    installFakeJira()
    await connect()
    expect(await lookUpIssue('https://acme.atlassian.net/browse/ACM-12')).toEqual({
      key: 'ACM-12',
      title: 'Fix login bug',
      status: 'To Do',
    })
    await expect(lookUpIssue('ACM-404')).rejects.toMatchObject({ kind: 'not-found' })
    await expect(lookUpIssue('ACM-13')).rejects.toMatchObject({ kind: 'no-access' })
  })

  it('needs a connection first', async () => {
    await expect(lookUpIssue('ACM-12')).rejects.toThrow(JiraError)
  })

  it('AC15.3 moves the issue to the mapped status and refreshes it on the task', async () => {
    const jira = installFakeJira()
    await connect()
    await setJiraStatusMap({ in_progress: 'In Progress', done: 'Done' })
    const task = await createTask({
      title: 'Fix login',
      dayKey: '2026-10-19',
      block: 'morning',
      jiraIssue: { key: 'ACM-12', title: 'Fix login bug', status: 'To Do' },
    })

    expect(await syncTaskStatusToJira(task, 'in_progress')).toBe('updated')
    expect(jira.issues.get('ACM-12')?.status).toBe('In Progress')
    const updated = await getTask(task.id)
    expect(updated?.jiraIssue?.status).toBe('In Progress')

    if (!updated) throw new Error('missing')
    expect(await syncTaskStatusToJira(updated, 'done')).toBe('updated')
    expect(jira.issues.get('ACM-12')?.status).toBe('Done')
  })

  it('does nothing without a mapping, and says so when the workflow can’t get there', async () => {
    const jira = installFakeJira()
    await connect()
    const task = await createTask({
      title: 'Fix login',
      dayKey: '2026-10-19',
      block: 'morning',
      jiraIssue: { key: 'ACM-12', title: 'Fix login bug', status: 'To Do' },
    })
    expect(await syncTaskStatusToJira(task, 'done')).toBe('no-mapping')
    await setJiraStatusMap({ done: 'Done' })
    // To Do → Done isn't a transition in this workflow.
    expect(await syncTaskStatusToJira(task, 'done')).toBe('no-transition')
    expect(jira.issues.get('ACM-12')?.status).toBe('To Do')
  })
})
