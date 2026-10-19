import { expect, test } from './fixtures'
import { expectNoA11yViolations, expectNoHorizontalScroll } from './helpers'

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
