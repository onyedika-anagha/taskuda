import { expect, test } from '@playwright/test'
import { addTask, blockArea } from './helpers'

test('AC6.1 after the first load, tasks can be created, completed and reloaded offline', async ({
  page,
  context,
}) => {
  await page.goto('/')
  await page.evaluate(() => navigator.serviceWorker.ready)
  // The first load registers the worker; reload once so it controls the page.
  await page.reload()
  await expect(page.getByRole('heading', { level: 1, name: /, today$/ })).toBeVisible()

  await context.setOffline(true)
  await expect(page.getByText('You’re offline. Everything still saves on this device.')).toBeVisible()

  await addTask(page, 'Offline task', 'Morning')
  await blockArea(page, 'Morning')
  await page.getByRole('button', { name: 'Status: To Do. Change to In Progress' }).click()
  // The label updates from the database, so the change is saved before reloading.
  await expect(page.getByRole('article', { name: 'Offline task, In Progress' })).toBeVisible()

  await page.reload()
  await blockArea(page, 'Morning')
  await expect(page.getByRole('article', { name: 'Offline task, In Progress' })).toBeVisible()
  await context.setOffline(false)
})

test('AC6.2 a change survives a close right after saving', async ({ page, context }) => {
  await page.goto('/')
  await addTask(page, 'Saved fast', 'Evening')
  await page.close()

  const reopened = await context.newPage()
  await reopened.goto('/')
  await blockArea(reopened, 'Evening')
  await expect(reopened.getByRole('article', { name: /^Saved fast/ })).toBeVisible()
})
