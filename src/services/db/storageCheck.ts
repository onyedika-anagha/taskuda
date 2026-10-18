import { db } from './database'

/**
 * Opens the database to confirm the browser lets Taskuda store data.
 * Fails in some private-browsing modes or when site data is blocked.
 */
export async function checkStorageAvailable(): Promise<boolean> {
  if (typeof indexedDB === 'undefined') return false
  try {
    await db.open()
    return true
  } catch {
    return false
  }
}
