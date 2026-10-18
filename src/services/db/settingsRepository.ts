import { db } from './database'

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const record = await db.settings.get(key)
  return record === undefined ? fallback : (record.value as T)
}

export async function setSetting<T>(key: string, value: T): Promise<void> {
  await db.settings.put({ key, value })
}

export async function deleteSetting(key: string): Promise<void> {
  await db.settings.delete(key)
}
