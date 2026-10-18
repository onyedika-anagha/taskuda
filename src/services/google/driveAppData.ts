import { DRIVE_APPDATA_SCOPE } from './googleAuth'
import { GoogleApiError, googleFetch } from './googleApi'

/**
 * Drive v3 calls limited to the hidden app-data folder (scope `drive.appdata`, NFR7):
 * Taskuda can only see files it created, never the user's other Drive files.
 */

const API = 'https://www.googleapis.com/drive/v3/files'
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files'
const SCOPES = [DRIVE_APPDATA_SCOPE]

export interface AppDataFile {
  id: string
  name: string
  createdTime: string
  appProperties: Record<string, string>
}

interface ListResponse {
  files?: AppDataFile[]
}

export async function listAppDataFiles(
  prefix: string,
  options?: { interactive?: boolean },
): Promise<AppDataFile[]> {
  const params = new URLSearchParams({
    spaces: 'appDataFolder',
    q: `name contains '${prefix.replace(/'/g, "\\'")}'`,
    orderBy: 'createdTime desc',
    pageSize: '100',
    fields: 'files(id,name,createdTime,appProperties)',
  })
  const response = await googleFetch(`${API}?${params}`, SCOPES, {}, options)
  const data = (await response.json()) as ListResponse
  return (data.files ?? []).filter((f) => f.name.startsWith(prefix))
}

/** Creates a JSON file in the app-data folder with a multipart upload. */
export async function createAppDataFile(
  name: string,
  content: string,
  appProperties: Record<string, string>,
  options?: { interactive?: boolean },
): Promise<AppDataFile> {
  const boundary = `taskuda-${crypto.randomUUID()}`
  const metadata = { name, parents: ['appDataFolder'], mimeType: 'application/json', appProperties }
  const body = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify(metadata),
    `--${boundary}`,
    'Content-Type: application/json',
    '',
    content,
    `--${boundary}--`,
    '',
  ].join('\r\n')

  const params = new URLSearchParams({ uploadType: 'multipart', fields: 'id,name,createdTime,appProperties' })
  const response = await googleFetch(
    `${UPLOAD}?${params}`,
    SCOPES,
    { method: 'POST', headers: { 'Content-Type': `multipart/related; boundary=${boundary}` }, body },
    options,
  )
  return (await response.json()) as AppDataFile
}

export async function downloadAppDataFile(id: string, options?: { interactive?: boolean }): Promise<string> {
  const response = await googleFetch(`${API}/${encodeURIComponent(id)}?alt=media`, SCOPES, {}, options)
  return response.text()
}

/** Permanent delete (app-data files can't be trashed). Already gone counts as done. */
export async function deleteAppDataFile(id: string): Promise<void> {
  try {
    await googleFetch(`${API}/${encodeURIComponent(id)}`, SCOPES, { method: 'DELETE' })
  } catch (error) {
    if (!(error instanceof GoogleApiError && error.kind === 'not-found')) throw error
  }
}
