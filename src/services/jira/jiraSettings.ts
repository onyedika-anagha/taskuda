import { getSecret, removeSecret, setSecret } from '@/services/crypto/secretVault'
import { deleteSetting, getSetting, setSetting } from '@/services/db/settingsRepository'
import type { JiraCredentials, JiraStatusMap } from '@/types/jira'

const KEYS = {
  site: 'jira.site',
  displayName: 'jira.displayName',
  statusMap: 'jira.statusMap',
} as const

export interface JiraSettings {
  site: string | null
  displayName: string | null
  statusMap: JiraStatusMap
}

export async function getJiraSettings(): Promise<JiraSettings> {
  const [site, displayName, statusMap] = await Promise.all([
    getSetting<string | null>(KEYS.site, null),
    getSetting<string | null>(KEYS.displayName, null),
    getSetting<JiraStatusMap>(KEYS.statusMap, {}),
  ])
  return { site, displayName, statusMap }
}

/** `https://Acme.atlassian.net/jira/…` or `acme` → `acme.atlassian.net`; `null` if it isn't Jira Cloud. */
export function normalizeSite(input: string): string | null {
  let host = input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .split('/')[0]
  if (/^[a-z0-9][a-z0-9-]*$/.test(host)) host = `${host}.atlassian.net`
  return /^[a-z0-9][a-z0-9-]{0,62}\.atlassian\.net$/.test(host) ? host : null
}

/** Email and token are stored together as one encrypted vault secret (PRD AC15.1). */
export async function saveJiraConnection(site: string, credentials: JiraCredentials, displayName: string) {
  await setSecret('jira', JSON.stringify(credentials))
  await setSetting(KEYS.site, site)
  await setSetting(KEYS.displayName, displayName)
}

export async function getJiraCredentials(): Promise<JiraCredentials | null> {
  const raw = await getSecret('jira')
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<JiraCredentials>
    return parsed.email && parsed.token ? { email: parsed.email, token: parsed.token } : null
  } catch {
    return null
  }
}

export async function disconnectJira(): Promise<void> {
  await removeSecret('jira').catch(() => undefined)
  await Promise.all([deleteSetting(KEYS.site), deleteSetting(KEYS.displayName)])
}

export const setJiraStatusMap = (map: JiraStatusMap) => setSetting(KEYS.statusMap, map)
