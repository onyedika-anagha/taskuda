import { screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createVault, listSecretNames } from '@/services/crypto/secretVault'
import { createTask, getTask } from '@/services/db/taskRepository'
import { getJiraSettings, saveJiraConnection, setJiraStatusMap } from '@/services/jira/jiraSettings'
import { installFakeJira } from '@/test/fakeJira'
import { renderWithApp } from '@/test/renderWithApp'
import { resetVaultState } from '@/test/resetVault'
import { todayKey } from '@/utils/dates'

const PASSPHRASE = 'correct horse battery'
const GOOD = { email: 'me@example.com', token: 'good-token' }

async function connected() {
  await createVault(PASSPHRASE)
  await saveJiraConnection('acme.atlassian.net', GOOD, 'Ada Lovelace')
}

describe('Jira (PRD FR15, design F12)', () => {
  beforeEach(resetVaultState)
  afterEach(() => vi.restoreAllMocks())

  it('AC15.1 connects after a successful test, setting the passphrase for the token', async () => {
    installFakeJira()
    const { user } = renderWithApp('/settings/integrations')
    await user.type(await screen.findByLabelText('Jira site'), 'https://acme.atlassian.net/jira')
    await user.type(screen.getByLabelText('Email'), GOOD.email)
    await user.type(screen.getByLabelText('API token'), GOOD.token)
    await user.click(screen.getByRole('button', { name: 'Test connection' }))

    const dialog = await screen.findByRole('dialog', { name: 'Set a passphrase' })
    await user.type(within(dialog).getByLabelText('Passphrase'), PASSPHRASE)
    await user.type(within(dialog).getByLabelText('Confirm passphrase'), PASSPHRASE)
    await user.click(within(dialog).getByRole('button', { name: 'Set passphrase' }))

    expect(
      await screen.findByText(
        (_content, element) =>
          element?.tagName === 'P' &&
          element.textContent === 'Connected to acme.atlassian.net as Ada Lovelace.',
      ),
    ).toBeInTheDocument()
    expect(await listSecretNames()).toEqual(['jira'])
    expect(screen.queryByDisplayValue(GOOD.token)).not.toBeInTheDocument()
  }, 20_000)

  it('a rejected token isn’t saved', async () => {
    installFakeJira()
    const { user } = renderWithApp('/settings/integrations')
    await user.type(await screen.findByLabelText('Jira site'), 'acme')
    await user.type(screen.getByLabelText('Email'), GOOD.email)
    await user.type(screen.getByLabelText('API token'), 'wrong')
    await user.click(screen.getByRole('button', { name: 'Test connection' }))
    expect(
      await screen.findByText('Jira rejected this token. Check the email and token.'),
    ).toBeInTheDocument()
    expect(await listSecretNames()).toEqual([])
  })

  it('validates the site address', async () => {
    const { user } = renderWithApp('/settings/integrations')
    await user.type(await screen.findByLabelText('Jira site'), 'jira.example.com')
    await user.click(screen.getByRole('button', { name: 'Test connection' }))
    expect(
      await screen.findByText('Use your Jira Cloud address, like yoursite.atlassian.net.'),
    ).toBeInTheDocument()
  })

  it('maps task statuses to Jira statuses', async () => {
    installFakeJira()
    await connected()
    const { user } = renderWithApp('/settings/integrations')
    await user.click(await screen.findByRole('button', { name: 'Load Jira statuses' }))
    await user.click(await screen.findByLabelText('When a task becomes Done, set the Jira issue to:'))
    await user.click(await screen.findByRole('option', { name: 'Done' }))
    await waitFor(async () => expect((await getJiraSettings()).statusMap).toMatchObject({ done: 'Done' }))
  })

  it('F12.2 / AC15.2 links an issue from the task editor; the note shows its key', async () => {
    installFakeJira()
    await connected()
    await createTask({ title: 'Fix login', dayKey: todayKey(), block: 'morning' })
    const { user } = renderWithApp('/')
    await user.click(await screen.findByRole('button', { name: 'Edit Fix login' }))
    const editor = await screen.findByRole('dialog', { name: 'Edit task' })
    await user.click(within(editor).getByRole('button', { name: 'Link Jira issue' }))

    const link = await screen.findByRole('dialog', { name: 'Link a Jira issue' })
    await user.type(within(link).getByLabelText('Issue'), 'ACM-404{Enter}')
    expect(
      await within(link).findByText('We couldn’t find ACM-404 on acme.atlassian.net. Check the key.'),
    ).toBeInTheDocument()
    await user.clear(within(link).getByLabelText('Issue'))
    await user.type(within(link).getByLabelText('Issue'), 'ACM-13{Enter}')
    expect(
      await within(link).findByText('Your Jira token doesn’t have access to this issue.'),
    ).toBeInTheDocument()

    await user.clear(within(link).getByLabelText('Issue'))
    await user.type(within(link).getByLabelText('Issue'), 'https://acme.atlassian.net/browse/ACM-12{Enter}')
    expect(await within(link).findByText('Fix login bug')).toBeInTheDocument()
    await user.click(within(link).getByRole('button', { name: 'Link' }))
    // Enter in the Link dialog didn't save the task: the editor is still open.
    expect(await screen.findByRole('dialog', { name: 'Edit task' })).toBeInTheDocument()

    await user.click(within(editor).getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('ACM-12')).toBeInTheDocument()
  })

  it('AC15.3 changing a linked task’s status updates the issue in Jira', async () => {
    const jira = installFakeJira()
    await connected()
    await setJiraStatusMap({ in_progress: 'In Progress' })
    const task = await createTask({
      title: 'Fix login',
      dayKey: todayKey(),
      block: 'morning',
      jiraIssue: { key: 'ACM-12', title: 'Fix login bug', status: 'To Do' },
    })
    const { user } = renderWithApp('/')
    await user.click(await screen.findByRole('button', { name: 'Status: To Do. Change to In Progress' }))
    await waitFor(() => expect(jira.issues.get('ACM-12')?.status).toBe('In Progress'))
    await waitFor(async () => expect((await getTask(task.id))?.jiraIssue?.status).toBe('In Progress'))
  })

  it('unlinks an issue', async () => {
    installFakeJira()
    await connected()
    const task = await createTask({
      title: 'Fix login',
      dayKey: todayKey(),
      block: 'morning',
      jiraIssue: { key: 'ACM-12', title: 'Fix login bug', status: 'To Do' },
    })
    const { user } = renderWithApp('/')
    await user.click(await screen.findByRole('button', { name: 'Edit Fix login' }))
    const editor = await screen.findByRole('dialog', { name: 'Edit task' })
    await user.click(within(editor).getByRole('button', { name: 'Unlink ACM-12' }))
    await user.click(within(editor).getByRole('button', { name: 'Save' }))
    await waitFor(async () => expect((await getTask(task.id))?.jiraIssue).toBeNull())
  })
})
