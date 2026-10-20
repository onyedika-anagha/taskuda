import { expect, test } from './fixtures'
import {
  addTask,
  blockArea,
  expectNoA11yViolations,
  expectNoHorizontalScroll,
  markDone,
  readClipboard,
} from './helpers'

test.use({ permissions: ['clipboard-read', 'clipboard-write'] })

test('S6 empty state, then copy in each format (AC14.2, AC14.3)', async ({ page }) => {
  await page.goto('/report')
  await expect(
    page.getByText('Nothing to report yet. Mark tasks done and they’ll show up here.'),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Copy report' })).toBeDisabled()

  await page.goto('/')
  await addTask(page, 'Ship login', 'Morning')
  await blockArea(page, 'Morning')
  await markDone(page, 'Ship login')

  await page.goto('/report')
  const expected = {
    Slack: '• Ship login',
    Teams: '- Ship login',
    Jira: '* Ship login',
    Email: 'Done:\n- Ship login',
  }
  for (const [format, line] of Object.entries(expected)) {
    await page.getByText(format, { exact: true }).click()
    await page.getByRole('button', { name: 'Copy report' }).click()
    await expect(page.getByRole('button', { name: 'Copied' })).toBeVisible()
    expect(await readClipboard(page)).toContain(line)
  }
  await expectNoHorizontalScroll(page)
  await expectNoA11yViolations(page)
})

test('AC24.1–AC24.3 the summary line opens the all-companies report only', async ({ page }) => {
  await page.goto('/settings/companies')
  await page.getByRole('button', { name: 'Add company' }).click()
  const dialog = page.getByRole('dialog', { name: 'Add company' })
  await dialog.getByLabel('Name').fill('Acme')
  await dialog.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByRole('button', { name: 'Edit Acme' })).toBeVisible()

  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: /, today$/ })).toBeVisible()
  await page.keyboard.press('n')
  const editor = page.getByRole('dialog', { name: 'New task' })
  await editor.getByLabel('Title').fill('Invoice')
  await editor.getByLabel('Company').click()
  await page.getByRole('option', { name: 'Acme' }).click()
  await editor.getByLabel('Time of day').click()
  await page.getByRole('option', { name: 'Morning' }).click()
  await editor.getByRole('button', { name: 'Save' }).click()
  await expect(editor).toBeHidden()
  await addTask(page, 'Inbox zero', 'Morning')
  await blockArea(page, 'Morning')
  await markDone(page, 'Invoice')
  await markDone(page, 'Inbox zero')

  await page.goto('/report')
  const preview = page.getByLabel('Preview')
  await expect(preview).toHaveValue(/\n\n2 done, across 1 company\n\n/)

  await page.getByLabel('Companies').click()
  await page.getByRole('option', { name: 'Acme' }).click()
  await expect(preview).toHaveValue(/Invoice/)
  await expect(preview).not.toHaveValue(/across/)
})
