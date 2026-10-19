import { useLiveQuery } from 'dexie-react-hooks'
import { listSecretNames } from '@/services/crypto/secretVault'
import { getJiraSettings, type JiraSettings } from '@/services/jira/jiraSettings'

export interface JiraSettingsView extends JiraSettings {
  /** A site and an (encrypted) token are both saved. */
  connected: boolean
}

/** `undefined` while loading. */
export function useJiraSettings(): JiraSettingsView | undefined {
  return useLiveQuery(async () => {
    const [settings, secrets] = await Promise.all([getJiraSettings(), listSecretNames()])
    return { ...settings, connected: !!settings.site && secrets.includes('jira') }
  }, [])
}
