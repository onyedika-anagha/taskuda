import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect } from 'react'
import { db } from '@/services/db/database'
import { readLocal, writeLocal } from '@/utils/safeStorage'

const WELCOME_DONE_KEY = 'taskuda.welcomeDone'

export function markWelcomeDone(): void {
  writeLocal(WELCOME_DONE_KEY, '1')
}

/**
 * S1 is shown once per device, and only when there's nothing here yet: a device that already
 * has tasks or companies (e.g. from before onboarding existed) skips it.
 */
export function useFirstRun(): 'checking' | 'show-welcome' | 'done' {
  const flagged = readLocal(WELCOME_DONE_KEY) === '1'
  const hasData = useLiveQuery(
    async () => flagged || (await db.tasks.count()) + (await db.companies.count()) > 0,
    [flagged],
  )

  useEffect(() => {
    if (!flagged && hasData) markWelcomeDone()
  }, [flagged, hasData])

  if (flagged || hasData) return 'done'
  return hasData === undefined ? 'checking' : 'show-welcome'
}
