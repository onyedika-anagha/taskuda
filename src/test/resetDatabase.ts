import { db } from '@/services/db/database'

/** Wipes every table so each test starts from an empty database. */
export async function resetDatabase(): Promise<void> {
  await db.open()
  await Promise.all(db.tables.map((table) => table.clear()))
}
