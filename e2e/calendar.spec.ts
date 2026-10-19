import { createFakeGoogle } from './fakeGoogle'
import { expect, test } from './fixtures'
import { addTask, blockArea, expectNoA11yViolations } from './helpers'

test('F9 tasks with a time become events, and events become tasks (AC8.1, AC8.3)', async ({
  page,
  context,
}) => {
  const google = createFakeGoogle()
  await google.install(context)

  await page.goto('/settings/integrations')
  await page.getByRole('button', { name: 'Connect', exact: true }).click()
  await expect(page.getByText('Synced just now')).toBeVisible()
  await expectNoA11yViolations(page)

  // A timed task on today becomes an event.
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await page.keyboard.press('n')
  const editor = page.getByRole('dialog', { name: 'New task' })
  await editor.getByLabel('Title').fill('Client call')
  await editor.getByLabel('Start time (optional)').fill('14:00')
  await editor.getByRole('button', { name: 'Save' }).click()
  await expect(editor).toBeHidden()

  await page.goto('/settings/integrations')
  await page.getByRole('button', { name: 'Sync now' }).click()
  await expect.poll(() => google.calendarEvents().map((e) => e.summary)).toEqual(['Client call'])

  // An event added in Google Calendar shows up as a task.
  const today = new Date()
  google.addCalendarEvent('Dentist', new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 30))
  await page.getByRole('button', { name: 'Sync now' }).click()
  await expect(page.getByText('Synced just now')).toBeVisible()

  await page.goto('/')
  const morning = await blockArea(page, 'Morning')
  await expect(
    morning.getByRole('article', { name: /^Dentist, 9:30 AM, To Do, from Google Calendar$/ }),
  ).toBeVisible()
  await expect(morning.getByText('From Google Calendar')).toBeVisible()
  await addTask(page, 'Untimed', 'Evening')
})
