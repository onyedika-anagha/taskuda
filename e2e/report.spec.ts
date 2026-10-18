import { expect, test } from '@playwright/test'
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
