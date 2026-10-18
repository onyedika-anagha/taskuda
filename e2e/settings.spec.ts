import { expect, test } from '@playwright/test'
import { expectNoA11yViolations, expectNoHorizontalScroll } from './helpers'

test('AI & Security section is reachable and accessible', async ({ page }) => {
  await page.goto('/settings')
  await page.getByRole('link', { name: 'AI & Security' }).click()
  await expect(
    page.getByText('No passphrase yet. You’ll set one when you save your first key.'),
  ).toBeVisible()
  await expectNoHorizontalScroll(page)
  await expectNoA11yViolations(page)
})
