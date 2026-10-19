import { useState } from 'react'
import { toast } from 'sonner'
import type { JiraConnectValues } from '@/schemas/jiraForm'
import { testJiraConnection } from '@/services/jira/jiraClient'
import { disconnectJira, normalizeSite, saveJiraConnection } from '@/services/jira/jiraSettings'
import { useVaultStore } from '@/stores/vaultStore'
import { jiraErrorMessage } from '@/utils/jiraErrorMessages'

/** Test + save the Jira connection (design F12.1). The token is saved only after Jira accepts it. */
export function useJiraConnect() {
  const ensureUnlocked = useVaultStore((s) => s.ensureUnlocked)
  const [error, setError] = useState<string | null>(null)

  return {
    error,
    async connect(values: JiraConnectValues): Promise<boolean> {
      setError(null)
      const site = normalizeSite(values.site)
      if (!site) return false
      const credentials = { email: values.email.trim(), token: values.token.trim() }
      try {
        const displayName = await testJiraConnection({ site, credentials })
        // First secret on this device: set the passphrase (D6), like the AI key.
        if (!(await ensureUnlocked())) return false
        await saveJiraConnection(site, credentials, displayName)
        toast.success(`Connected as ${displayName}`)
        return true
      } catch (cause) {
        setError(jiraErrorMessage(cause))
        return false
      }
    },
    async disconnect() {
      await disconnectJira()
      toast.success('Jira disconnected. Linked issues stay on your tasks.')
    },
  }
}
