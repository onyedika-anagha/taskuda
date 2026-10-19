import { expect, test } from './fixtures'
import { blockArea, isMobile } from './helpers'

/** Seeds tasks straight into IndexedDB (as the app stores them) so 50 notes exist quickly. */
async function seedTasks(page: import('@playwright/test').Page, count: number) {
  await page.evaluate(async (total) => {
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const dayKey = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
    const open = indexedDB.open('taskuda')
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      open.onsuccess = () => resolve(open.result)
      open.onerror = () => reject(open.error)
    })
    const tx = db.transaction('tasks', 'readwrite')
    const blocks = ['morning', 'afternoon', 'evening']
    for (let i = 0; i < total; i++) {
      tx.objectStore('tasks').put({
        id: `seed-${i}`,
        title: `Seeded task ${i + 1}`,
        notes: '',
        companyId: null,
        dayKey,
        block: blocks[i % 3],
        order: (i + 1) * 1000,
        startTime: null,
        durationMinutes: null,
        status: 'todo',
        carriedOverCount: 0,
        carriedFromTaskId: null,
        carriedToTaskId: null,
        source: 'manual',
        jiraIssue: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
    }
    await new Promise((resolve) => {
      tx.oncomplete = resolve
    })
    db.close()
  }, count)
}

test('NFR3 repeat visit loads the app shell in under 2 seconds', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload() // now controlled by the service worker
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  const loadMs = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    return nav.loadEventEnd - nav.startTime
  })
  expect(loadMs).toBeLessThan(2000)
})

test('NFR3 / DAC3 with 50 notes, a drop shows its new place within 100 ms', async ({ page }) => {
  test.skip(isMobile(page), 'Measured on the multi-column layout')
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await seedTasks(page, 50)
  await page.reload()
  const evening = await blockArea(page, 'Evening')
  await expect(page.getByRole('article')).toHaveCount(50)

  const handle = page.getByRole('button', { name: 'Drag Seeded task 1', exact: true })
  const target = evening.getByRole('article').first()
  const from = await handle.boundingBox()
  const to = await target.boundingBox()
  if (!from || !to) throw new Error('layout missing')

  // Time from releasing the mouse to the note appearing in the Evening column.
  await page.evaluate(() => {
    const w = window as unknown as { dropAt?: number; shownAt?: number }
    window.addEventListener('pointerup', () => (w.dropAt = performance.now()), { capture: true })
    const column = document.querySelector('section[aria-labelledby="block-evening-heading"]')
    if (!column) throw new Error('no column')
    new MutationObserver(() => {
      if (w.dropAt && !w.shownAt && column.querySelector('article[aria-label^="Seeded task 1,"]')) {
        w.shownAt = performance.now()
      }
    }).observe(column, { childList: true, subtree: true })
  })
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
  await page.mouse.down()
  await page.mouse.move(from.x + 20, from.y + 20, { steps: 5 })
  await page.mouse.move(to.x + to.width / 2, to.y + 10, { steps: 20 })
  await page.mouse.up()

  await expect(evening.getByRole('article', { name: /^Seeded task 1,/ })).toBeVisible()
  const { dropAt, shownAt } = await page.evaluate(() => {
    const w = window as unknown as { dropAt?: number; shownAt?: number }
    return { dropAt: w.dropAt ?? null, shownAt: w.shownAt ?? null }
  })
  expect(dropAt).not.toBeNull()
  // The note is previewed in the column during the drag, so it can already be there at release (0 ms).
  expect(Math.max(0, (shownAt ?? dropAt ?? 0) - (dropAt ?? 0))).toBeLessThan(100)
})
