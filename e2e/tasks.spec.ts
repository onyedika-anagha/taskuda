import { expect, test } from './fixtures'
import type { Page } from '@playwright/test'
import {
  addTask,
  blockArea,
  expectNoA11yViolations,
  expectNoHorizontalScroll,
  isMobile,
  noteTitles,
} from './helpers'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: /, today$/ })).toBeVisible()
})

test('AC1.1 / AC1.3 empty day shows the blocks and their empty states', async ({ page }) => {
  for (const block of ['Morning', 'Afternoon', 'Evening'] as const) {
    const area = await blockArea(page, block)
    await expect(area.getByText(`Nothing planned for the ${block.toLowerCase()}.`)).toBeVisible()
  }
  await expectNoHorizontalScroll(page)
  await expectNoA11yViolations(page)
})

test('DAC1 creates a title-only task with N, typing and Enter', async ({ page }) => {
  await page.keyboard.press('n')
  const dialog = page.getByRole('dialog', { name: 'New task' })
  await expect(dialog.getByLabel('Title')).toBeFocused()
  await page.keyboard.type('Write report')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('article', { name: /^Write report/ })).toBeVisible()
  await expect(page.getByText('Task added')).toBeVisible()
})

test('AC2.2 edits survive a page reload', async ({ page }) => {
  await addTask(page, 'Standup', 'Morning')
  await blockArea(page, 'Morning')
  await page.getByRole('button', { name: 'Edit Standup' }).click()
  const dialog = page.getByRole('dialog', { name: 'Edit task' })
  await dialog.getByLabel('Title').fill('Daily standup')
  await dialog.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Changes saved')).toBeVisible()
  await page.reload()
  await blockArea(page, 'Morning')
  await expect(page.getByRole('article', { name: /^Daily standup/ })).toBeVisible()
})

test('AC4.1 / AC4.3 status cycles with one click each and is kept after reload', async ({ page }) => {
  await addTask(page, 'Standup', 'Morning')
  await blockArea(page, 'Morning')
  await page.getByRole('button', { name: 'Status: To Do. Change to In Progress' }).click()
  await page.getByRole('button', { name: 'Status: In Progress. Change to Done' }).click()
  await expect(page.getByRole('article', { name: 'Standup, Done' })).toBeVisible()
  await page.reload()
  await blockArea(page, 'Morning')
  await expect(page.getByRole('article', { name: 'Standup, Done' })).toBeVisible()
})

test('AC2.3 deleting asks for confirmation', async ({ page }) => {
  await addTask(page, 'Standup', 'Morning')
  await blockArea(page, 'Morning')
  await page.getByRole('button', { name: 'Options for Standup' }).click()
  await page.getByRole('menuitem', { name: 'Delete task' }).click()
  await page
    .getByRole('alertdialog', { name: 'Delete this task?' })
    .getByRole('button', { name: 'Delete' })
    .click()
  await expect(page.getByRole('article', { name: /^Standup/ })).toHaveCount(0)
})

async function deleteStandup(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Options for Standup' }).click()
  await page.getByRole('menuitem', { name: 'Delete task' }).click()
  await page
    .getByRole('alertdialog', { name: 'Delete this task?' })
    .getByRole('button', { name: 'Delete' })
    .click()
  await expect(page.getByRole('article', { name: /^Standup/ })).toHaveCount(0)
}

test('AC18.1 DAC15 Undo with the mouse restores the task, and it survives reload', async ({ page }) => {
  await addTask(page, 'Standup', 'Morning')
  await blockArea(page, 'Morning')
  await deleteStandup(page)
  await page.getByRole('button', { name: 'Undo' }).click()
  await expect(page.getByText('Task restored')).toBeVisible()
  await page.reload()
  await blockArea(page, 'Morning')
  await expect(page.getByRole('article', { name: /^Standup/ })).toBeVisible()
})

test('AC18.5 DAC15 Undo with the keyboard (Alt+T focuses the toast)', async ({ page }) => {
  await addTask(page, 'Standup', 'Morning')
  await blockArea(page, 'Morning')
  await deleteStandup(page)
  // Alt+T focuses the toast list. Each toast is a tab stop, and "Task added" may still be showing,
  // so Tab until Undo has focus (a few presses at most).
  const undo = page.getByRole('button', { name: 'Undo' })
  await page.keyboard.press('Alt+T')
  for (let i = 0; i < 5 && !(await undo.evaluate((el) => el === document.activeElement)); i++) {
    await page.keyboard.press('Tab')
  }
  await expect(undo).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('article', { name: /^Standup/ })).toBeVisible()
})

test('AC3.1 drags a note to another block with the mouse, and the move survives reload', async ({ page }) => {
  test.skip(isMobile(page), 'Phones drop onto tabs; covered by the next test')
  await addTask(page, 'Standup', 'Morning')
  const handle = page.getByRole('button', { name: 'Drag Standup' })
  const evening = page.getByRole('region', { name: /^Evening/ })
  const from = await handle.boundingBox()
  const to = await evening.getByText('Nothing planned for the evening.').boundingBox()
  if (!from || !to) throw new Error('Missing layout')

  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
  await page.mouse.down()
  await page.mouse.move(from.x + 20, from.y + 20, { steps: 5 })
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 15 })
  await page.mouse.up()

  await expect(evening.getByRole('article', { name: /^Standup/ })).toBeVisible()
  await page.reload()
  await expect(
    page.getByRole('region', { name: /^Evening/ }).getByRole('article', { name: /^Standup/ }),
  ).toBeVisible()
})

test('phones: dropping a note on a tab moves it to that block', async ({ page }) => {
  test.skip(!isMobile(page), 'Phone layout only')
  await addTask(page, 'Standup', 'Morning')
  await blockArea(page, 'Morning')
  const handle = page.getByRole('button', { name: 'Drag Standup' })
  const tab = page.getByRole('tab', { name: /^Evening/ })
  const from = await handle.boundingBox()
  const to = await tab.boundingBox()
  if (!from || !to) throw new Error('Missing layout')

  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
  await page.mouse.down()
  await page.mouse.move(from.x + 10, from.y - 10, { steps: 5 })
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 15 })
  await page.mouse.up()

  await expect(tab).toHaveText('Evening1')
  const evening = await blockArea(page, 'Evening')
  await expect(evening.getByRole('article', { name: /^Standup/ })).toBeVisible()
})

test('AC3.2 / DAC9 reorders with the keyboard only', async ({ page }) => {
  await addTask(page, 'First', 'Morning')
  await addTask(page, 'Second', 'Morning')
  const morning = await blockArea(page, 'Morning')
  expect(await noteTitles(morning)).toEqual(['First', 'Second'])

  const handle = page.getByRole('button', { name: 'Drag Second' })
  await handle.focus()
  await page.keyboard.press('Space')
  // Picked up: dnd-kit marks the handle pressed (announcements can be replaced quickly under load).
  await expect(handle).toHaveAttribute('aria-pressed', 'true')
  await page.keyboard.press('ArrowUp')
  // Wait for the screen-reader announcement of the new position, like a keyboard user hearing it.
  await expect(page.getByText('Second: Morning, position 1 of 2.')).toBeAttached()
  await page.keyboard.press('Space')

  await expect.poll(() => noteTitles(morning)).toEqual(['Second', 'First'])
})

test('AC3.2 moves between blocks from the note menu', async ({ page }) => {
  await addTask(page, 'Standup', 'Morning')
  await blockArea(page, 'Morning')
  await page.getByRole('button', { name: 'Options for Standup' }).click()
  await page.getByRole('menuitem', { name: 'Move to Afternoon' }).click()
  const afternoon = await blockArea(page, 'Afternoon')
  await expect(afternoon.getByRole('article', { name: /^Standup/ })).toBeVisible()
})

test('DAC10 editor and menu have no accessibility violations', async ({ page }) => {
  await addTask(page, 'Standup', 'Morning')
  await blockArea(page, 'Morning')
  await expectNoA11yViolations(page)
  await page.getByRole('button', { name: 'Edit Standup' }).click()
  await expect(page.getByRole('dialog', { name: 'Edit task' })).toBeVisible()
  await expectNoA11yViolations(page)
})

test('companies color-code tasks (AC5.1, AC5.2)', async ({ page }) => {
  await page.getByRole('link', { name: 'Settings', exact: true }).click()
  // Desktop opens on Companies; smaller screens show the section list first.
  if (!(await page.getByRole('button', { name: 'Add company' }).isVisible())) {
    await page.getByRole('link', { name: 'Companies' }).click()
  }
  await page.getByRole('button', { name: 'Add company' }).click()
  const dialog = page.getByRole('dialog', { name: 'Add company' })
  await dialog.getByLabel('Name').fill('Acme')
  await dialog.getByTitle('Rose').click()
  await expect(dialog.getByRole('radio', { name: 'Rose' })).toBeChecked()
  await dialog.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByRole('button', { name: 'Edit Acme' })).toBeVisible()
  await expectNoA11yViolations(page)

  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: /, today$/ })).toBeVisible()
  await page.keyboard.press('n')
  const editor = page.getByRole('dialog', { name: 'New task' })
  await editor.getByLabel('Title').fill('Invoice')
  await editor.getByLabel('Company').click()
  await page.getByRole('option', { name: 'Acme' }).click()
  await editor.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByRole('article', { name: /^Invoice, Acme/ })).toBeVisible()
})
