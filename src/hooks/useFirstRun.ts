import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect } from 'react'
import { db } from '@/services/db/database'
import { getSetupStep, isSetupDone, markSetupDone } from '@/services/onboarding/onboardingProgress'

/**
 * S1 is shown once per device, and only when there's nothing here yet: a device that already
 * has tasks or companies (e.g. from before onboarding existed) skips it (PRD Out of Scope 29).
 * Setup that was started and not finished always resumes, even once a company exists (AC34.5).
 */
export function useFirstRun(): 'checking' | 'show-welcome' | 'done' {
  const done = isSetupDone()
  const inProgress = !done && getSetupStep() !== null
  const hasData = useLiveQuery(
    async () => done || inProgress || (await db.tasks.count()) + (await db.companies.count()) > 0,
    [done, inProgress],
  )

  useEffect(() => {
    if (!done && !inProgress && hasData) markSetupDone()
  }, [done, inProgress, hasData])

  if (done) return 'done'
  if (inProgress) return 'show-welcome'
  if (hasData) return 'done'
  return hasData === undefined ? 'checking' : 'show-welcome'
}
