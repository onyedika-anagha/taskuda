import { expect, test } from './fixtures'
import { blockArea, expectNoA11yViolations, expectNoHorizontalScroll } from './helpers'

// Wednesday, Oct 21, 2026, 9:00 AM.
const NOW = new Date(2026, 9, 21, 9, 0)

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: NOW })
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: /, today$/ })).toBeVisible()
})

test('DAC22 adds a due date in 2 extra interactions and shows it on the note', async ({ page }) => {
  await page.keyboard.press('n')
  const editor = page.getByRole('dialog', { name: 'New task' })
  await editor.getByLabel('Title').fill('Send invoice')
  await editor.getByRole('button', { name: 'Add due date' }).click() // 1
  await editor.getByLabel('Due date').fill('2026-10-23') // 2
  await editor.getByRole('button', { name: 'Save' }).click()
  await expect(editor).toBeHidden()

  const area = await blockArea(page, 'Morning')
  await expect(area.getByText('Due Fri, Oct 23')).toBeVisible()
})

test('DAC23 / DAC25 a late task gets its marker within a minute and opens from the at-risk list', async ({
  page,
}) => {
  await page.keyboard.press('n')
  const editor = page.getByRole('dialog', { name: 'New task' })
  await editor.getByLabel('Title').fill('Standup')
  await editor.getByLabel('Start time (optional)').fill('09:15')
  await editor.getByRole('button', { name: 'Save' }).click()
  await expect(editor).toBeHidden()
  await expect(page.getByText('0 of 1 done')).toBeVisible()
  await expect(page.getByRole('button', { name: /at risk/ })).toBeHidden()

  // 9:15 start + 10 minutes' grace → Running late by 9:26.
  await page.clock.fastForward('26:00')
  const area = await blockArea(page, 'Morning')
  await expect(area.getByText('Running late · 9:15 AM')).toBeVisible({ timeout: 20_000 })
  await expectNoHorizontalScroll(page)
  await expectNoA11yViolations(page)

  await page.getByRole('button', { name: 'At risk · 1, show 1 task' }).click() // 1
  const list = page.getByRole('dialog', { name: 'At risk today' })
  await expect(list).toBeVisible()
  await expectNoHorizontalScroll(page)
  await expectNoA11yViolations(page)
  await list.getByRole('button', { name: /^Standup\s*Running late/ }).click() // 2
  await expect(page.getByRole('dialog', { name: 'Edit task' })).toBeVisible()
})
