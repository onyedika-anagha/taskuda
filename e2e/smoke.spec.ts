import { AxeBuilder } from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test('app loads with no horizontal scrolling and no WCAG AA violations', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Taskuda' })).toBeVisible()

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
  expect(overflow).toBe(false)

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  expect(results.violations).toEqual([])
})
