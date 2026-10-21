import { expect, test } from './fixtures'
import { expectNoA11yViolations, expectNoHorizontalScroll } from './helpers'

test.use({ firstRun: true })

test('F1 first run: intro, setup with several companies, then today; shown only once', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/welcome$/)
  await expect(page.getByRole('heading', { name: 'One board for every job.' })).toBeVisible()
  await expectNoHorizontalScroll(page)
  await expectNoA11yViolations(page)

  await page.getByRole('button', { name: 'Skip' }).click()
  await expect(page.getByRole('heading', { name: 'Step 1 of 3 · Companies' })).toBeVisible()

  // DAC27: each company is a name plus Enter; the color is preselected and focus stays in the field.
  const name = page.getByLabel('Company name')
  for (const company of ['Acme', 'Globex', 'Initech']) {
    await name.fill(company)
    await name.press('Enter')
    await expect(page.getByRole('button', { name: `Remove ${company}` })).toBeVisible()
    await expect(name).toBeFocused()
  }
  await expectNoHorizontalScroll(page)
  await expectNoA11yViolations(page)
  await page.getByRole('button', { name: 'Continue' }).click()

  await expect(page.getByRole('heading', { name: 'Step 2 of 3 · Workday' })).toBeVisible()
  await expectNoA11yViolations(page)
  await page.getByRole('button', { name: 'Continue' }).click()

  await expect(page.getByRole('heading', { name: 'Back up to Google Drive' })).toBeVisible()
  await expectNoA11yViolations(page)
  await page.getByRole('button', { name: 'Not now' }).click()

  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByText(/^You’re all set\./)).toBeVisible()
  await expect(page.getByRole('heading', { level: 1, name: /, today$/ })).toBeVisible()
  await page.reload()
  await expect(page).toHaveURL(/\/$/)
})

test('DAC26 a new user reaches Today in 4 interactions by skipping everything', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Skip' }).click() // 1: intro
  await page.getByRole('button', { name: 'Skip for now' }).click() // 2: companies
  await page.getByRole('button', { name: 'Skip' }).click() // 3: workday
  await page.getByRole('button', { name: 'Not now' }).click() // 4: backup
  await expect(page.getByRole('heading', { level: 1, name: /, today$/ })).toBeVisible()
})

test('AC34.5 reloading mid-setup resumes at the same step, without the intro', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Skip' }).click()
  await page.getByLabel('Company name').fill('Acme')
  await page.getByLabel('Company name').press('Enter')
  await expect(page.getByRole('button', { name: 'Remove Acme' })).toBeVisible()

  await page.reload()
  await expect(page).toHaveURL(/\/welcome$/)
  await expect(page.getByRole('heading', { name: 'Step 1 of 3 · Companies' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Remove Acme' })).toBeVisible()
})

test('AC33.3 “I already use Taskuda” goes straight to the backup step', async ({ page }) => {
  await page.goto('/')
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Next' }).click()
  await expectNoA11yViolations(page)
  await page.getByRole('button', { name: 'I already use Taskuda' }).click()
  await expect(page.getByRole('heading', { name: 'Step 3 of 3 · Backup' })).toBeVisible()
})

test('settings layout is accessible at every size, and About replays the intro', async ({ page }) => {
  await page.goto('/welcome')
  await page.getByRole('button', { name: 'Skip' }).click()
  await page.getByRole('button', { name: 'Skip for now' }).click()
  await page.getByRole('button', { name: 'Skip' }).click()
  await page.getByRole('button', { name: 'Not now' }).click()
  await page.goto('/settings')
  await expect(page.getByRole('navigation', { name: 'Settings sections' })).toBeVisible()
  await expectNoHorizontalScroll(page)
  await expectNoA11yViolations(page)
  await page.getByRole('link', { name: 'About' }).click()
  await expect(page.getByText(/Version \d+\.\d+\.\d+/)).toBeVisible()
  await expectNoA11yViolations(page)

  await page.getByRole('button', { name: 'Show intro again' }).click()
  await expect(page).toHaveURL(/\/intro$/)
  await page.getByRole('button', { name: 'Skip' }).click()
  await expect(page).toHaveURL(/\/settings\/about$/)
})
