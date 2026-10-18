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
    await page.getByRole('tab', { name: new RegExp(`^${block}`) }).click()
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

export async function expectNoA11yViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  expect(
    results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
  ).toEqual([])
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
