import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'
import {
  addTask,
  blockArea,
  expectNoA11yViolations,
  expectNoHorizontalScroll,
  expectNoToastA11yViolations,
} from './helpers'

const SETTINGS_SECTIONS = [
  'companies',
  'workday',
  'integrations',
  'backup',
  'ai-security',
  'voice',
  'stats',
  'about',
]

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

    test('DAC8 / DAC10 the FR18–FR29 additions: no horizontal scroll, no WCAG 2.1 AA violations', async ({
      page,
    }) => {
      test.slow()
      // Tuesday, Oct 20, 2026, 4:25 PM: a working day, inside the default eye-break hours.
      await page.clock.install({ time: new Date(2026, 9, 20, 16, 25) })

      // S7h with every section expanded.
      await page.goto('/settings/workday')
      await page.getByRole('switch', { name: /Quiet hours/ }).click()
      await page.getByRole('switch', { name: /Eye breaks/ }).click()
      await page.getByRole('combobox', { name: /Daily time budget/ }).click()
      await page.getByRole('option', { name: '1 h' }).click()
      await expect(page.getByLabel('Remind me to rest my eyes')).toBeVisible()
      await checkScreen(page)

      // S3 with Repeat: Weekly, then Monthly with the short-month hint.
      await page.goto('/')
      await expect(page.getByRole('heading', { level: 1, name: /, today$/ })).toBeVisible()
      await page.keyboard.press('n')
      const editor = page.getByRole('dialog', { name: 'New task' })
      await editor.getByLabel('Title').fill('Client call')
      await editor.getByLabel('Start time (optional)').fill('16:50')
      await editor.getByRole('combobox', { name: 'Repeat' }).click()
      await page.getByRole('option', { name: 'Weekly', exact: true }).click()
      await expect(editor.getByRole('group', { name: 'Repeat on' })).toBeVisible()
      await checkScreen(page)
      await editor.getByRole('combobox', { name: 'Repeat' }).click()
      await page.getByRole('option', { name: 'Monthly', exact: true }).click()
      await editor.getByRole('combobox', { name: 'On day' }).click()
      await page.getByRole('option', { name: '31', exact: true }).click()
      await expect(editor.getByText('In shorter months, it moves to the last day.')).toBeVisible()
      await checkScreen(page)
      await editor.getByRole('button', { name: 'Save' }).click()
      await expect(editor).toBeHidden()

      // D8, then the repeating variant of D1 (both cancelled).
      const area = await blockArea(page, 'Afternoon')
      await area.getByRole('button', { name: 'Edit Client call' }).click()
      const edit = page.getByRole('dialog', { name: 'Edit task' })
      await edit.getByLabel('Title').fill('Client call with notes')
      await edit.getByRole('button', { name: 'Save' }).click()
      await expect(page.getByRole('alertdialog', { name: 'Change repeating task?' })).toBeVisible()
      await checkScreen(page)
      await page.getByRole('alertdialog').getByRole('button', { name: 'Cancel' }).click()
      // D8 Cancel keeps the editor open with the changes (design D8); close it from there.
      await expect(edit.getByLabel('Title')).toHaveValue('Client call with notes')
      await edit.getByRole('button', { name: 'Cancel' }).click()
      await expect(edit).toBeHidden()
      await area.getByRole('button', { name: 'Options for Client call' }).click()
      await page.getByRole('menuitem', { name: 'Delete task' }).click()
      await expect(page.getByRole('alertdialog', { name: 'Delete repeating task?' })).toBeVisible()
      await checkScreen(page)
      await page.getByRole('alertdialog').getByRole('button', { name: 'Cancel' }).click()

      // Action toasts: the 4:50 PM reminder and an eye break.
      await page.clock.fastForward('25:20')
      await expect(page.getByText('Starting now: Client call.')).toBeVisible({ timeout: 20_000 })
      await expect(page.getByText(/^Time for an eye break\./)).toBeVisible({ timeout: 20_000 })
      await expectNoToastA11yViolations(page)

      // Both banners: the closeout nudge (5:30 PM) and the 1 h budget.
      await page.clock.fastForward('01:10:00')
      await expect(page.getByRole('button', { name: 'Not today' })).toBeVisible({ timeout: 20_000 })
      await expect(page.locator('[data-slot="notice"]', { hasText: 'past your 1 h budget' })).toBeVisible({
        timeout: 20_000,
      })
      await checkScreen(page)

      // S7f with all five tiles (a closeout makes them show) and the carry-over section.
      await page.evaluate(
        () =>
          new Promise<void>((resolve, reject) => {
            const open = indexedDB.open('taskuda')
            open.onsuccess = () => {
              const tx = open.result.transaction('closeouts', 'readwrite')
              tx.objectStore('closeouts').put({
                dayKey: '2026-10-20',
                startedAt: 0,
                finishedAt: 1,
                reportCopiedAt: null,
                rating: 4,
                reflection: '',
                outcomes: {},
              })
              tx.oncomplete = () => resolve()
              tx.onerror = () => reject(tx.error)
            }
            open.onerror = () => reject(open.error)
          }),
      )
      await page.goto('/settings/stats')
      await expect(page.getByText('Days within time budget')).toBeVisible()
      await expect(page.getByText(/^Time in Taskuda today:/)).toBeVisible()
      await checkScreen(page)
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
