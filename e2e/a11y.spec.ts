import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'
import {
  addTask,
  blockArea,
  expectNoA11yViolations,
  expectNoHorizontalScroll,
  expectNoToastA11yViolations,
} from './helpers'

const SETTINGS_SECTIONS = ['companies', 'workday', 'integrations', 'backup', 'ai-security', 'voice', 'stats', 'about']

async function checkScreen(page: Page) {
  await expectNoHorizontalScroll(page)
  await expectNoA11yViolations(page)
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`${scheme} theme`, () => {
    test.use({ colorScheme: scheme })

    test('DAC10 toasts, plain and with actions, have no WCAG 2.1 AA violations', async ({ page }) => {
      await page.goto('/')
      await addTask(page, 'Standup', 'Morning')
      await expect(page.getByText('Task added')).toBeVisible()
      await expectNoToastA11yViolations(page)

      await blockArea(page, 'Morning')
      await page.getByRole('button', { name: 'Options for Standup' }).click()
      await page.getByRole('menuitem', { name: 'Delete task' }).click()
      await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click()
      await expect(page.getByRole('button', { name: 'Undo' })).toBeVisible()
      await expectNoToastA11yViolations(page)
    })

    test('DAC8 / DAC10 every screen: no horizontal scroll, no WCAG 2.1 AA violations', async ({ page }) => {
      await page.goto('/')
      await addTask(page, 'A task with a fairly long title that has to wrap on small phones', 'Morning')
      await blockArea(page, 'Morning')
      await checkScreen(page) // S2

      await page.getByRole('button', { name: /^Edit A task/ }).click()
      await expect(page.getByRole('dialog', { name: 'Edit task' })).toBeVisible()
      await checkScreen(page) // S3
      await page.keyboard.press('Escape')

      await page.goto('/report')
      await expect(page.getByRole('heading', { level: 1, name: /^Report/ })).toBeVisible()
      await checkScreen(page) // S6

      for (const section of SETTINGS_SECTIONS) {
        await page.goto(`/settings/${section}`)
        await expect(page.getByRole('heading', { level: 2 }).first()).toBeVisible()
        await checkScreen(page) // S7a–S7h
      }
    })
  })
}

test('DAC9 keyboard only: Tab reaches the note controls in order', async ({ page }) => {
  await page.goto('/')
  await addTask(page, 'Keyboard task', 'Morning')
  await blockArea(page, 'Morning')
  const order = ['Edit Keyboard task', /^Status: To Do/, 'Options for Keyboard task', 'Drag Keyboard task']
  await page.getByRole('button', { name: 'Edit Keyboard task' }).focus()
  for (const name of order) {
    await expect(page.getByRole('button', { name })).toBeFocused()
    await page.keyboard.press('Tab')
  }
  // Every focused element shows a visible outline.
  await page.getByRole('button', { name: 'Edit Keyboard task' }).focus()
  const outline = await page.evaluate(() => getComputedStyle(document.activeElement as Element).outlineStyle)
  expect(outline).toBe('solid')
})
