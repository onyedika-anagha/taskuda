import { readFile } from 'node:fs/promises'
import { expect, skipWelcome, test } from './fixtures'
import { createFakeGoogle } from './fakeGoogle'
import { addTask, blockArea, expectNoA11yViolations, expectNoHorizontalScroll } from './helpers'

test('F7 / F8 back up on one device and restore on another (AC7.1, AC7.2, AC7.4)', async ({ browser }) => {
  const google = createFakeGoogle()

  const deviceA = await browser.newContext()
  await skipWelcome(deviceA)
  await google.install(deviceA)
  const a = await deviceA.newPage()
  await a.goto('/settings/backup')
  await a.getByRole('button', { name: 'Connect Google Drive' }).click()
  await expect(a.getByRole('region', { name: 'Google Drive' }).getByText('Backed up just now')).toBeVisible()
  await expectNoA11yViolations(a)
  await expectNoHorizontalScroll(a)

  await a.goto('/')
  await addTask(a, 'Made on device A', 'Morning')
  await a.goto('/settings/backup')
  await a.getByRole('button', { name: 'Back up now' }).click()
  await expect.poll(() => google.files.length).toBe(2)
  await deviceA.close()

  const deviceB = await browser.newContext()
  await skipWelcome(deviceB)
  await google.install(deviceB)
  const b = await deviceB.newPage()
  await b.goto('/settings/backup')
  await b.getByRole('button', { name: 'Restore from Drive' }).click()
  const list = b.getByRole('dialog', { name: 'Restore from Google Drive' })
  await list.getByRole('button').filter({ hasText: '·' }).first().click()
  const confirm = b.getByRole('alertdialog', { name: 'Restore this backup?' })
  await expect(confirm).toContainText('This backup was made on another device')
  await expectNoA11yViolations(b)
  await confirm.getByRole('button', { name: 'Restore' }).click()
  await expect(b.getByText(/^Restored backup from /)).toBeVisible()

  await b.goto('/')
  const morning = await blockArea(b, 'Morning')
  await expect(morning.getByRole('article', { name: /^Made on device A/ })).toBeVisible()
  await deviceB.close()
})

test('CR2 export to a file and import it back', async ({ page }) => {
  await page.goto('/')
  await addTask(page, 'In the file', 'Evening')
  await page.goto('/settings/backup')

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export to file' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/^taskuda-backup-\d{4}-\d{2}-\d{2}\.json$/)
  const path = await download.path()
  const text = await readFile(path, 'utf8')
  expect(JSON.parse(text)).toMatchObject({ format: 'taskuda-backup', version: 2 })

  // Wipe the task, then import the file.
  await page.goto('/')
  const evening = await blockArea(page, 'Evening')
  await evening.getByRole('button', { name: 'Options for In the file' }).click()
  await page.getByRole('menuitem', { name: 'Delete task' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click()
  await expect(page.getByRole('article', { name: /^In the file/ })).toHaveCount(0)

  await page.goto('/settings/backup')
  await page.locator('input[type="file"]').setInputFiles(path)
  await page
    .getByRole('alertdialog', { name: 'Restore this backup?' })
    .getByRole('button', { name: 'Restore' })
    .click()
  await expect(page.getByText(/^Restored backup from /)).toBeVisible()
  await page.goto('/')
  const restored = await blockArea(page, 'Evening')
  await expect(restored.getByRole('article', { name: /^In the file/ })).toBeVisible()
})
