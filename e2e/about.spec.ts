import { expect, test } from './fixtures'
import { expectNoA11yViolations, expectNoHorizontalScroll } from './helpers'

for (const scheme of ['light', 'dark'] as const) {
  test(`the static /about page reads without JavaScript-built content and is accessible (${scheme})`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: scheme })
    await page.goto('/about/')
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'Taskuda is a free day planner for people with more than one job.',
      }),
    ).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: 'Frequently asked questions' })).toBeVisible()
    await expectNoHorizontalScroll(page)
    await expectNoA11yViolations(page)
  })
}

test('the /about HTML carries its content and structured data before any script runs', async ({
  request,
}) => {
  const html = await (await request.get('/about/')).text()
  expect(html).toContain('Taskuda is a free day planner for people with more than one job.')
  expect(html).toContain('"@type": "FAQPage"')
  expect(html).toContain('"@type": "WebApplication"')
})

test('crawler files are served, and indexing is off by default', async ({ request }) => {
  expect(await (await request.get('/robots.txt')).text()).toBe('User-agent: *\nDisallow: /\n')
  expect(await (await request.get('/llms.txt')).text()).toMatch(/^# Taskuda/)
  expect(await (await request.get('/pricing.md')).text()).toMatch(/^# Pricing — Taskuda/)
})

test('Settings → About links to the page', async ({ page }) => {
  await page.goto('/settings/about')
  await page.getByRole('link', { name: 'About Taskuda' }).click()
  await expect(page).toHaveURL(/\/about\/$/)
  await expect(page.getByRole('link', { name: 'Open Taskuda' }).first()).toBeVisible()
})
