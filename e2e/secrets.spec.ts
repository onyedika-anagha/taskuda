import { expect, test, type Request } from '@playwright/test'
import { addTask, expectNoA11yViolations } from './helpers'

const KEY = 'AIzaE2E-not-a-real-key-WXYZ'
const PASSPHRASE = 'correct horse battery'
const RECS = [{ title: 'Batch your calls', detail: 'Put client calls back to back after lunch.' }]

/** Every IndexedDB record Taskuda stores, serialized, to search for plaintext. */
async function dumpIndexedDb(page: import('@playwright/test').Page): Promise<string> {
  return page.evaluate(async () => {
    const open = indexedDB.open('taskuda')
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      open.onsuccess = () => resolve(open.result)
      open.onerror = () => reject(open.error)
    })
    const out: Record<string, unknown[]> = {}
    for (const name of Array.from(database.objectStoreNames)) {
      const request = database.transaction(name).objectStore(name).getAll()
      out[name] = await new Promise<unknown[]>((resolve) => {
        request.onsuccess = () => resolve(request.result)
      })
    }
    database.close()
    return JSON.stringify(out, (_key, value) => (value instanceof CryptoKey ? '[CryptoKey]' : value))
  })
}

test('AC12.3 / AC12.4 / AC12.6 the AI key is encrypted, remembered, and sent only to Google', async ({
  page,
}) => {
  const keyLeaks: string[] = []
  page.on('request', (request: Request) => {
    const carriesKey =
      request.url().includes(KEY) ||
      Object.values(request.headers()).some((v) => v.includes(KEY)) ||
      (request.postData() ?? '').includes(KEY)
    if (carriesKey && new URL(request.url()).host !== 'generativelanguage.googleapis.com') {
      keyLeaks.push(request.url())
    }
  })
  await page.route('https://generativelanguage.googleapis.com/**', (route) =>
    route.fulfill({
      json: { candidates: [{ content: { parts: [{ text: JSON.stringify({ recommendations: RECS }) }] } }] },
    }),
  )

  await page.goto('/settings/ai-security')
  await page.getByText('Gemini', { exact: true }).click()
  await page.getByLabel('API key').fill(KEY)
  await page.getByRole('button', { name: 'Save' }).click()
  const setPassphrase = page.getByRole('dialog', { name: 'Set a passphrase' })
  await setPassphrase.getByLabel('Passphrase', { exact: true }).fill(PASSPHRASE)
  await setPassphrase.getByLabel('Confirm passphrase').fill(PASSPHRASE)
  await setPassphrase.getByRole('button', { name: 'Set passphrase' }).click()
  await expect(page.getByText('••••••••WXYZ')).toBeVisible()
  await expectNoA11yViolations(page)

  // AC12.3: nothing readable in storage.
  const stored = await dumpIndexedDb(page)
  expect(stored).not.toContain(KEY)
  expect(stored).not.toContain(PASSPHRASE)

  // AC12.4: after a reload the key is still usable without the passphrase.
  await page.reload()
  await expect(page.getByText('••••••••WXYZ')).toBeVisible()
  await page.getByRole('button', { name: 'Test key' }).click()
  await expect(page.getByText('Key works.')).toBeVisible()

  await page.goto('/')
  await addTask(page, 'Write spec', 'Morning')
  await page.getByRole('button', { name: 'Close out day' }).click()
  const dialog = page.getByRole('dialog', { name: /^Close out / })
  await dialog.getByRole('button', { name: 'Carry over all' }).click()
  await dialog.getByRole('button', { name: 'Next' }).click()
  await dialog.getByText('Good', { exact: true }).click()
  await dialog.getByRole('button', { name: 'Next' }).click()
  await dialog.getByRole('button', { name: 'Send to Gemini' }).click()
  await expect(dialog.getByText('Batch your calls')).toBeVisible()
  await expectNoA11yViolations(page)

  expect(keyLeaks).toEqual([])
})
