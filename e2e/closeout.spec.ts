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

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('DAC4 / AC10–AC11 close out a day and find carried tasks tomorrow', async ({ page }) => {
  await addTask(page, 'Write spec', 'Morning')
  await addTask(page, 'Ship login', 'Afternoon')
  await blockArea(page, 'Afternoon')
  await markDone(page, 'Ship login')

  await page.getByRole('button', { name: 'Close out day' }).click()
  const dialog = page.getByRole('dialog', { name: /^Close out / })
  await expectNoA11yViolations(page)
  await dialog.getByRole('button', { name: 'Carry over all' }).click()
  await dialog.getByRole('button', { name: 'Next' }).click()
  await dialog.getByText('Good', { exact: true }).click()
  await expectNoA11yViolations(page)
  await dialog.getByRole('button', { name: 'Next' }).click()
  await dialog.getByRole('button', { name: 'Skip' }).click()
  await expectNoA11yViolations(page)
  await dialog.getByRole('button', { name: 'Copy report' }).click()
  await expect(dialog.getByRole('button', { name: 'Copied' })).toBeVisible()
  const copied = await readClipboard(page)
  expect(copied).toContain('_Done_\n• Ship login')
  expect(copied).toContain('_Carried to tomorrow_\n• Write spec')
  await expectNoHorizontalScroll(page)
  await dialog.getByRole('button', { name: 'Finish day' }).click()

  await expect(page.getByText('Day closed. 1 task carried to tomorrow.')).toBeVisible()
  await expect(page.getByText(/^Day closed at /)).toBeVisible()

  await page.getByRole('button', { name: 'Next day' }).click()
  const morning = await blockArea(page, 'Morning')
  await expect(morning.getByRole('article', { name: 'Write spec, To Do, carried over' })).toBeVisible()
})

test('DAC13 a closeout survives a reload and resumes where it was left', async ({ page }) => {
  await addTask(page, 'Write spec', 'Morning')
  await page.getByRole('button', { name: 'Close out day' }).click()
  const dialog = page.getByRole('dialog', { name: /^Close out / })
  await dialog.getByText('Delete', { exact: true }).click()
  await dialog.getByRole('button', { name: 'Next' }).click()
  await dialog.getByLabel('Anything worth remembering? (optional)').fill('Long meetings')
  await expect(dialog.getByText('Step 2 of 4: Reflect')).toBeVisible()
  // NFR2 allows up to 1 s for a change to be saved; a real reload never comes this fast.
  await page.waitForTimeout(1000)

  await page.reload()
  await page.getByRole('button', { name: 'Close out day' }).click()
  await expect(dialog.getByText('Step 2 of 4: Reflect')).toBeVisible()
  await expect(dialog.getByLabel('Anything worth remembering? (optional)')).toHaveValue('Long meetings')
  await dialog.getByRole('button', { name: 'Back' }).click()
  await expect(dialog.getByRole('radio', { name: 'Delete' })).toBeChecked()
})

test('stats show the closeout', async ({ page }) => {
  await page.getByRole('button', { name: 'Close out day' }).click()
  const dialog = page.getByRole('dialog', { name: /^Close out / })
  await dialog.getByRole('button', { name: 'Next' }).click()
  await dialog.getByText('Okay', { exact: true }).click()
  await dialog.getByRole('button', { name: 'Next' }).click()
  await dialog.getByRole('button', { name: 'Skip' }).click()
  await dialog.getByRole('button', { name: 'Finish day' }).click()
  await expect(page.getByText('Day closed.')).toBeVisible()

  await page.goto('/settings/stats')
  await expect(page.getByText('Tasks dropped without a decision')).toBeVisible()
  await expectNoA11yViolations(page)
})
