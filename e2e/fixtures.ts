import { test as base, type BrowserContext } from '@playwright/test'

export { expect } from '@playwright/test'

/** Marks the first-run welcome as done, so a test starts on the Today canvas. */
export async function skipWelcome(context: BrowserContext): Promise<void> {
  await context.addInitScript(() => window.localStorage.setItem('taskuda.welcomeDone', '1'))
}

/** Every test starts past the welcome, except where it opts out with `test.use({ firstRun: true })`. */
export const test = base.extend<{ firstRun: boolean }>({
  firstRun: [false, { option: true }],
  // Named `provide`, not `use`, so the React hooks lint rule doesn't mistake it for a hook.
  context: async ({ context, firstRun }, provide) => {
    if (!firstRun) await skipWelcome(context)
    await provide(context)
  },
})
