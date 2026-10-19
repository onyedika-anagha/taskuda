import { useState } from 'react'
import { listStatuses } from '@/services/jira/jiraClient'
import { getJiraTarget } from '@/services/jira/jiraService'
import { useVaultStore } from '@/stores/vaultStore'
import { jiraErrorMessage } from '@/utils/jiraErrorMessages'

export type StatusesState =
  | { state: 'idle' }
  | { state: 'loading' }
  | { state: 'loaded'; statuses: string[] }
  | { state: 'failed'; message: string }

/** Loads the site's status names for the mapping selects, on demand. */
export function useJiraStatuses() {
  const ensureUnlocked = useVaultStore((s) => s.ensureUnlocked)
  const [statuses, setStatuses] = useState<StatusesState>({ state: 'idle' })

  async function load() {
    setStatuses({ state: 'loading' })
    try {
      if (!(await ensureUnlocked())) {
        setStatuses({ state: 'idle' })
        return
      }
      setStatuses({ state: 'loaded', statuses: await listStatuses(await getJiraTarget()) })
    } catch (error) {
      setStatuses({ state: 'failed', message: jiraErrorMessage(error) })
    }
  }

  return { statuses, load }
}
