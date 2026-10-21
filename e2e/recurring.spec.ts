import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'
import { blockArea } from './helpers'

// Tuesday, Oct 20, 2026, 8:00 AM local time. The clock keeps running from there.
const TUESDAY = new Date(2026, 9, 20, 8, 0)

async function openToday(page: Page): Promise<void> {
  await page.clock.install({ time: TUESDAY })
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: /, today$/ })).toBeVisible()
}

async function addRepeatingTask(page: Page, title: string, repeat: string): Promise<void> {
  await page.keyboard.press('n')
  const dialog = page.getByRole('dialog', { name: 'New task' })
  await dialog.getByLabel('Title').fill(title)
  await dialog.getByRole('combobox', { name: 'Repeat' }).click()
  await page.getByRole('option', { name: repeat, exact: true }).click()
  await dialog.getByRole('button', { name: 'Save' }).click()
  await expect(dialog).toBeHidden()
}

const note = async (page: Page, title: string) =>
  (await blockArea(page, 'Morning')).getByRole('article', { name: new RegExp(`^${title},`) })

test('F14 / DAC17 a weekly task repeats on the same weekday next week', async ({ page }) => {
  await openToday(page)
  // DAC17: two interactions more than DAC1 (open Repeat, choose Weekly); Tuesday is preselected.
  await addRepeatingTask(page, 'Client update', 'Weekly')
  await expect(await note(page, 'Client update')).toContainText('Repeats weekly')

  await page.goto('/day/2026-10-21')
  await expect(page.getByRole('article', { name: /^Client update,/ })).toHaveCount(0)
  await page.goto('/day/2026-10-27')
  const nextWeek = await note(page, 'Client update')
  await expect(nextWeek).toBeVisible()
  await expect(nextWeek).toHaveAccessibleName(/repeats weekly/)
})

test('AC20.5 D8 "This and future tasks" changes later days, not earlier ones', async ({ page }) => {
  await openToday(page)
  await addRepeatingTask(page, 'Standup', 'Every day')
  await expect(await note(page, 'Standup')).toContainText('Repeats daily')

  await page.goto('/day/2026-10-21')
  await expect(await note(page, 'Standup')).toContainText('Repeats daily')
  await (await note(page, 'Standup')).getByRole('button', { name: 'Edit Standup' }).click()
  const editor = page.getByRole('dialog', { name: 'Edit task' })
  await editor.getByLabel('Title').fill('Team sync')
  await editor.getByRole('button', { name: 'Save' }).click()
  const d8 = page.getByRole('alertdialog', { name: 'Change repeating task?' })
  await d8.getByRole('button', { name: 'This and future tasks' }).click()
  await expect(editor).toBeHidden()
  await expect(await note(page, 'Team sync')).toBeVisible()

  await page.goto('/day/2026-10-22')
  await expect(await note(page, 'Team sync')).toBeVisible()
  await page.goto('/day/2026-10-20')
  await expect(await note(page, 'Standup')).toBeVisible()
})

test('AC20.5 / FR18 deleting "This and future tasks" can be undone, series included', async ({ page }) => {
  await openToday(page)
  await addRepeatingTask(page, 'Standup', 'Every day')
  const standup = await note(page, 'Standup')
  await standup.getByRole('button', { name: 'Options for Standup' }).click()
  await page.getByRole('menuitem', { name: 'Delete' }).click()
  await page
    .getByRole('alertdialog', { name: 'Delete repeating task?' })
    .getByRole('button', { name: 'This and future tasks' })
    .click()
  await expect(standup).toBeHidden()
  await page.getByRole('button', { name: 'Undo' }).click()
  await expect(page.getByText('Task restored')).toBeVisible()
  await expect(await note(page, 'Standup')).toBeVisible()

  await page.goto('/day/2026-10-23')
  await expect(await note(page, 'Standup')).toBeVisible()
})
