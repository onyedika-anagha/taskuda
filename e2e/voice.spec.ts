import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'
import { blockArea, expectNoA11yViolations, expectNoHorizontalScroll } from './helpers'

const spokenLines = (page: Page) =>
  page.evaluate(() => (window as unknown as { taskudaSpoken: string[] }).taskudaSpoken)

/** Records speech instead of playing it, and starts the clock at `time`. */
async function setUp(page: Page, time: Date): Promise<void> {
  await page.addInitScript(() => {
    const spoken: string[] = []
    ;(window as unknown as { taskudaSpoken: string[] }).taskudaSpoken = spoken
    window.speechSynthesis.speak = (utterance) => {
      spoken.push(utterance.text)
    }
  })
  await page.clock.install({ time })
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: /, today$/ })).toBeVisible()
}

function todayAt(h: number, m: number, s = 0): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, s)
}

async function addClientCall(page: Page): Promise<void> {
  await page.keyboard.press('n')
  const editor = page.getByRole('dialog', { name: 'New task' })
  await editor.getByLabel('Title').fill('Client call')
  await editor.getByLabel('Start time (optional)').fill('14:00')
  await editor.getByRole('button', { name: 'Save' }).click()
  await expect(editor).toBeHidden()
}

test('DAC12 a reminder is spoken and shown on screen at the right time', async ({ page }) => {
  // Record speech instead of playing it.
  await page.addInitScript(() => {
    const spoken: string[] = []
    ;(window as unknown as { taskudaSpoken: string[] }).taskudaSpoken = spoken
    window.speechSynthesis.speak = (utterance) => {
      spoken.push(utterance.text)
    }
  })
  const now = new Date()
  const at = (h: number, m: number, s = 0) =>
    new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, s)
  await page.clock.install({ time: at(13, 54) })

  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: /, today$/ })).toBeVisible()
  await page.keyboard.press('n')
  const editor = page.getByRole('dialog', { name: 'New task' })
  await editor.getByLabel('Title').fill('Client call')
  await editor.getByLabel('Start time (optional)').fill('14:00')
  await editor.getByRole('button', { name: 'Save' }).click()
  await expect(editor).toBeHidden()

  await page.clock.fastForward('01:20')
  await expect(page.getByText('Up next at 2:00 PM: Client call.')).toBeVisible()
  expect(await page.evaluate(() => (window as unknown as { taskudaSpoken: string[] }).taskudaSpoken)).toEqual(
    ['Up next at 2:00 PM: Client call.'],
  )
})

test('Voice settings are accessible', async ({ page }) => {
  await page.goto('/settings/voice')
  await expect(page.getByRole('switch', { name: /Spoken reminders/ })).toBeVisible()
  await expectNoHorizontalScroll(page)
  await expectNoA11yViolations(page)
})

test('AC22.2 / DAC16 Snooze from the reminder brings it back later', async ({ page }) => {
  await setUp(page, todayAt(13, 54))
  await addClientCall(page)
  await page.clock.fastForward('06:10') // 2:00:10 PM
  await expect(page.getByText('Starting now: Client call.')).toBeVisible()

  await page.getByRole('button', { name: 'Snooze 5 min' }).click()
  await expect(page.getByText(/^Reminder snoozed until 2:05 PM\.$/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Snooze 5 min' })).toBeHidden()

  await page.clock.fastForward('05:10')
  await expect(page.getByRole('button', { name: 'Snooze 5 min' })).toBeVisible()
  expect((await spokenLines(page)).filter((t) => t === 'Starting now: Client call.')).toHaveLength(2)
})

test('AC22.3 / DAC16 Mark done from the reminder completes the task', async ({ page }) => {
  await setUp(page, todayAt(13, 54))
  await addClientCall(page)
  await page.clock.fastForward('06:10')
  await page.getByRole('button', { name: 'Mark done' }).click()
  await blockArea(page, 'Afternoon')
  await expect(page.getByRole('article', { name: /^Client call.*Done/ })).toBeVisible()
})

test('DAC18 a reminder never takes focus or clears what you are typing', async ({ page }) => {
  await setUp(page, todayAt(13, 54))
  await addClientCall(page)
  await page.keyboard.press('n')
  const title = page.getByRole('dialog', { name: 'New task' }).getByLabel('Title')
  await title.fill('Draft notes')
  await page.clock.fastForward('06:10')
  await expect(page.getByText('Starting now: Client call.')).toBeVisible()
  await expect(title).toBeFocused()
  await page.keyboard.type(' for Acme')
  await expect(title).toHaveValue('Draft notes for Acme')
})

test('AC21.2 / DAC19 the close-out nudge opens the closeout in one click', async ({ page }) => {
  // Tuesday, Oct 20, 2026 (a working day by default), just before the 5:30 PM nudge.
  await setUp(page, new Date(2026, 9, 20, 17, 29))
  await page.clock.fastForward('01:20')
  const banner = page.locator('[data-slot="notice"]')
  await expect(banner).toContainText('It’s 5:30 PM. Ready to close out your day?')
  // The banner and the spoken alert come from separate ticks, so either can land first.
  await expect.poll(() => spokenLines(page)).toContain('It’s 5:30 PM. Time to close out your day.')
  await banner.getByRole('button', { name: 'Close out day' }).click()
  await expect(page.getByRole('dialog', { name: /^Close out / })).toBeVisible()
})
