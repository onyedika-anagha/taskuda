import { expect, test } from './fixtures'
import { expectNoA11yViolations, expectNoHorizontalScroll } from './helpers'

test.use({ firstRun: true })

test('F1 first run: welcome, first company, then today; shown only once', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/welcome$/)
  await expect(page.getByRole('heading', { name: 'Plan your day across every job.' })).toBeVisible()
  await expectNoHorizontalScroll(page)
  await expectNoA11yViolations(page)

  await page.getByLabel('Name').fill('Acme')
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByRole('heading', { name: 'Back up to Google Drive' })).toBeVisible()
  await expectNoA11yViolations(page)
  await page.getByRole('button', { name: 'Not now' }).click()

  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('heading', { level: 1, name: /, today$/ })).toBeVisible()
  await page.reload()
  await expect(page).toHaveURL(/\/$/)
})

test('settings layout is accessible at every size', async ({ page }) => {
  await page.goto('/welcome')
  await page.getByRole('button', { name: 'Skip for now' }).click()
  await page.getByRole('button', { name: 'Not now' }).click()
  await page.goto('/settings')
  await expect(page.getByRole('navigation', { name: 'Settings sections' })).toBeVisible()
  await expectNoHorizontalScroll(page)
  await expectNoA11yViolations(page)
  await page.getByRole('link', { name: 'About' }).click()
  await expect(page.getByText(/Version \d+\.\d+\.\d+/)).toBeVisible()
  await expectNoA11yViolations(page)
})
