import { AxeBuilder } from '@axe-core/playwright'
import { expect, type Locator, type Page } from '@playwright/test'

export type BlockName = 'Morning' | 'Afternoon' | 'Evening'

export const isMobile = (page: Page) => (page.viewportSize()?.width ?? 1280) < 768

/** Opens the editor with the `N` shortcut, fills the title and block, and saves. */
export async function addTask(page: Page, title: string, block: BlockName): Promise<void> {
  // Shortcuts listen once the canvas has rendered.
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await page.keyboard.press('n')
  const dialog = page.getByRole('dialog', { name: 'New task' })
  await dialog.getByLabel('Title').fill(title)
  await dialog.getByLabel('Time of day').click()
  await page.getByRole('option', { name: block }).click()
  await dialog.getByRole('button', { name: 'Save' }).click()
  await expect(dialog).toBeHidden()
}

/** The block region on tablet/desktop, or the selected tab panel on phones. */
export async function blockArea(page: Page, block: BlockName): Promise<Locator> {
  if (isMobile(page)) {
    const tab = page.getByRole('tab', { name: new RegExp(`^${block}`) })
    // Clicking the open tab again does nothing, and a toast may be fading out over it.
    if ((await tab.getAttribute('aria-selected')) !== 'true') await tab.click()
    return page.getByRole('tabpanel')
  }
  return page.getByRole('region', { name: new RegExp(`^${block}`) })
}

export async function noteTitles(area: Locator): Promise<string[]> {
  return area
    .getByRole('article')
    .evaluateAll((notes) =>
      notes.map((n) => n.querySelector('button[aria-label^="Edit "]')?.textContent?.trim() ?? ''),
    )
}

/** Lets animations that are about to start (and Sonner's mount step) settle before a scan. */
async function waitForSettledPage(page: Page): Promise<void> {
  // An animation for something just inserted starts on the next frame, so let two frames pass.
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
  )
  // Fading dialogs and toasts give mid-animation colors; scan the settled page.
  // Infinite ones (loading pulses) never settle, so they're ignored. Sonner starts a toast's fade-in
  // a frame after inserting it (`data-mounted`), so wait for toasts to settle too.
  await page.waitForFunction(
    () =>
      document
        .getAnimations()
        .every((a) => a.playState !== 'running' || a.effect?.getTiming().iterations === Infinity) &&
      [...document.querySelectorAll('[data-sonner-toast]')].every(
        (toast) =>
          toast.getAttribute('data-mounted') === 'true' && toast.getAttribute('data-removed') !== 'true',
      ),
  )
}

function violationList(results: Awaited<ReturnType<AxeBuilder['analyze']>>): string[] {
  return results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)
}

const WCAG_21_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

/**
 * Scans the page, leaving out toasts: they fade out on their own timer, so one can start leaving
 * mid-scan. `expectNoToastA11yViolations` checks toasts on their own.
 */
export async function expectNoA11yViolations(page: Page): Promise<void> {
  await waitForSettledPage(page)
  const results = await new AxeBuilder({ page })
    .withTags(WCAG_21_AA)
    .exclude('[data-sonner-toaster]')
    .analyze()
  expect(violationList(results)).toEqual([])
}

/** Scans only the toasts showing now, right after they've settled. */
export async function expectNoToastA11yViolations(page: Page): Promise<void> {
  await waitForSettledPage(page)
  const results = await new AxeBuilder({ page })
    .withTags(WCAG_21_AA)
    .include('[data-sonner-toaster]')
    .analyze()
  expect(violationList(results)).toEqual([])
}

export async function expectNoHorizontalScroll(page: Page): Promise<void> {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
  expect(overflow).toBe(false)
}

/** Clipboard text with line endings normalized (Windows returns CRLF). */
export async function readClipboard(page: Page): Promise<string> {
  const text = await page.evaluate(() => navigator.clipboard.readText())
  return text.replace(/\r\n/g, '\n')
}

/** Cycles a note's status from To Do to Done. */
export async function markDone(page: Page, title: string): Promise<void> {
  const note = page.getByRole('article', { name: new RegExp(`^${title}`) })
  await note.getByRole('button', { name: /^Status: To Do/ }).click()
  await note.getByRole('button', { name: /^Status: In Progress/ }).click()
  await expect(note.getByRole('button', { name: /^Status: Done/ })).toBeVisible()
}
