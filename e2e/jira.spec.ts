import { expect, test } from './fixtures'
import { blockArea, expectNoA11yViolations } from './helpers'

const AUTH = `Basic ${Buffer.from('me@example.com:good-token').toString('base64')}`
const PASSPHRASE = 'correct horse battery'

test('F12 connect Jira, link an issue, and push a status change (AC15.1–AC15.3)', async ({ page }) => {
  const issue = { key: 'ACM-12', summary: 'Fix login bug', status: 'To Do' }
  const proxied: { path: string; method: string }[] = []
  // Vercel functions don't run under `vite preview`; stand in for api/jira.ts and the Jira site.
  await page.route('**/api/jira', async (route) => {
    const request = route.request()
    if (request.headers().authorization !== AUTH) return route.fulfill({ status: 401, json: {} })
    const { path, method } = request.postDataJSON() as { path: string; method: string }
    proxied.push({ path, method })
    if (path === '/rest/api/3/myself') return route.fulfill({ json: { displayName: 'Ada Lovelace' } })
    if (path === '/rest/api/3/status') {
      return route.fulfill({ json: [{ name: 'To Do' }, { name: 'In Progress' }, { name: 'Done' }] })
    }
    if (path.endsWith('/transitions')) {
      if (method === 'POST') {
        issue.status = 'In Progress'
        return route.fulfill({ status: 204, body: '' })
      }
      return route.fulfill({ json: { transitions: [{ id: '21', to: { name: 'In Progress' } }] } })
    }
    return route.fulfill({
      json: { key: issue.key, fields: { summary: issue.summary, status: { name: issue.status } } },
    })
  })

  await page.goto('/settings/integrations')
  await page.getByLabel('Jira site').fill('acme')
  await page.getByLabel('Email').fill('me@example.com')
  await page.getByLabel('API token').fill('good-token')
  await page.getByRole('button', { name: 'Test connection' }).click()
  const passphrase = page.getByRole('dialog', { name: 'Set a passphrase' })
  await passphrase.getByLabel('Passphrase', { exact: true }).fill(PASSPHRASE)
  await passphrase.getByLabel('Confirm passphrase').fill(PASSPHRASE)
  await passphrase.getByRole('button', { name: 'Set passphrase' }).click()
  await expect(page.getByText('Connected to acme.atlassian.net as Ada Lovelace.')).toBeVisible()

  await page.getByRole('button', { name: 'Load Jira statuses' }).click()
  await page.getByLabel('When a task becomes In Progress, set the Jira issue to:').click()
  await page.getByRole('option', { name: 'In Progress' }).click()
  await expectNoA11yViolations(page)

  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await page.keyboard.press('n')
  const editor = page.getByRole('dialog', { name: 'New task' })
  await editor.getByLabel('Title').fill('Fix login')
  await editor.getByLabel('Time of day').click()
  await page.getByRole('option', { name: 'Morning' }).click()
  await editor.getByRole('button', { name: 'Link Jira issue' }).click()
  const link = page.getByRole('dialog', { name: 'Link a Jira issue' })
  await link.getByLabel('Issue').fill('https://acme.atlassian.net/browse/ACM-12')
  await link.getByRole('button', { name: 'Look up' }).click()
  await expect(link.getByText('Fix login bug')).toBeVisible()
  await link.getByRole('button', { name: 'Link' }).click()
  await editor.getByRole('button', { name: 'Save' }).click()

  const morning = await blockArea(page, 'Morning')
  const note = morning.getByRole('article', { name: /^Fix login/ })
  await expect(note.getByText('ACM-12')).toBeVisible()
  await note.getByRole('button', { name: 'Status: To Do. Change to In Progress' }).click()
  await expect.poll(() => issue.status).toBe('In Progress')
  expect(proxied).toContainEqual({ path: '/rest/api/3/issue/ACM-12/transitions', method: 'POST' })
})
