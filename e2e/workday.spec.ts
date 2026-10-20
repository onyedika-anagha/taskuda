import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'
import { addTask, blockArea, readClipboard } from './helpers'

test.use({ permissions: ['clipboard-read', 'clipboard-write'] })

// Friday, Oct 16, 2026, 10:00 AM local time. The clock keeps running from there.
const FRIDAY = new Date(2026, 9, 16, 10, 0)

async function closeOutCarryingAll(page: Page): Promise<string> {
  await page.getByRole('button', { name: 'Close out day' }).click()
  const dialog = page.getByRole('dialog', { name: /^Close out / })
  await dialog.getByRole('button', { name: 'Carry over all' }).click()
  await dialog.getByRole('button', { name: 'Next' }).click()
  await dialog.getByText('Good', { exact: true }).click()
  await dialog.getByRole('button', { name: 'Next' }).click()
  await dialog.getByRole('button', { name: 'Skip' }).click()
  await dialog.getByRole('button', { name: 'Copy report' }).click()
  await expect(dialog.getByRole('button', { name: 'Copied' })).toBeVisible()
  const copied = await readClipboard(page)
  await dialog.getByRole('button', { name: 'Finish day' }).click()
  return copied
}

async function setSaturdayAsWorkingDay(page: Page): Promise<void> {
  await page.goto('/settings/workday')
  const saturday = page.getByRole('button', { name: 'Saturday' })
  await saturday.click()
  await expect(saturday).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByText('Saved', { exact: true })).toBeVisible()
}

test('AC19.1 working days default to Mon–Fri, can be changed, and keep at least one', async ({ page }) => {
  await page.goto('/settings/workday')
  const group = page.getByRole('group', { name: 'Working days' })
  for (const day of ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']) {
    await expect(group.getByRole('button', { name: day })).toHaveAttribute('aria-pressed', 'true')
  }
  await expect(group.getByRole('button', { name: 'Sunday' })).toHaveAttribute('aria-pressed', 'false')

  await setSaturdayAsWorkingDay(page)
  await page.reload()
  await expect(page.getByRole('button', { name: 'Saturday' })).toHaveAttribute('aria-pressed', 'true')

  for (const day of ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']) {
    await page.getByRole('button', { name: day }).click()
  }
  // Only Saturday is left; it can't be unticked.
  await page.getByRole('button', { name: 'Saturday' }).click()
  await expect(page.getByRole('button', { name: 'Saturday' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByText('Keep at least one working day.')).toBeVisible()
})

test('AC11.1 / AC19.3 a Friday closeout carries tasks to Monday', async ({ page }) => {
  await page.clock.setSystemTime(FRIDAY)
  await page.goto('/')
  await addTask(page, 'Write spec', 'Morning')

  const copied = await closeOutCarryingAll(page)
  expect(copied).toContain('_Carried to Monday_\n• Write spec')
  await expect(page.getByText('Day closed. 1 task carried to Monday.')).toBeVisible()

  await page.goto('/day/2026-10-17')
  const saturday = await blockArea(page, 'Morning')
  await expect(saturday.getByRole('article')).toHaveCount(0)
  await page.goto('/day/2026-10-19')
  const monday = await blockArea(page, 'Morning')
  await expect(monday.getByRole('article', { name: 'Write spec, To Do, carried over' })).toBeVisible()
})

test('AC19.3 with Saturday as a working day, a Friday closeout carries to Saturday', async ({ page }) => {
  await page.clock.setSystemTime(FRIDAY)
  await setSaturdayAsWorkingDay(page)
  await page.goto('/')
  await addTask(page, 'Write spec', 'Morning')

  const copied = await closeOutCarryingAll(page)
  expect(copied).toContain('_Carried to tomorrow_\n• Write spec')
  await expect(page.getByText('Day closed. 1 task carried to tomorrow.')).toBeVisible()
})

test('AC21.1 / AC23.1 close-out reminder and quiet hours settings', async ({ page }) => {
  await page.goto('/settings/workday')
  await expect(page.getByLabel('Remind me to close out at')).toHaveValue('17:30')
  await page.getByRole('switch', { name: /Close-out reminder/ }).click()
  await expect(page.getByLabel('Remind me to close out at')).toBeHidden()

  await page.getByRole('switch', { name: /Quiet hours/ }).click()
  const quiet = page.getByRole('group', { name: 'Quiet hours' })
  await expect(quiet.getByLabel('From')).toHaveValue('22:00')
  await expect(quiet.getByText('Runs overnight, into the next morning.')).toBeVisible()
  await quiet.getByLabel('To').fill('22:00')
  await expect(quiet.getByText('Start and end can’t be the same.')).toBeVisible()
  await quiet.getByLabel('To').fill('06:30')
  await page.reload()
  await expect(page.getByRole('group', { name: 'Quiet hours' }).getByLabel('To')).toHaveValue('06:30')
  await expect(page.getByLabel('Remind me to close out at')).toBeHidden()
})
