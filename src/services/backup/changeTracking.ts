import type { Table } from 'dexie'
import { db } from '@/services/db/database'
import { isLocalOnlySetting } from './backupSnapshot'

/**
 * Calls `onChange` after any write to data that goes into backups. Writes to `deviceKeys`
 * and to local-only settings (e.g. the last-backup time) don't count, so backups don't loop.
 * Returns a function that stops tracking.
 */
export function trackBackedUpChanges(onChange: () => void): () => void {
  const tables: Table[] = [
    db.tasks,
    db.companies,
    db.closeouts,
    db.activityLog,
    db.calendarMappings,
    db.vault,
  ]
  const notify = () => {
    // Run after the transaction, outside Dexie's hook context.
    queueMicrotask(onChange)
  }
  const notifySetting = (key: unknown) => {
    if (typeof key === 'string' && !isLocalOnlySetting(key)) notify()
  }

  const unsubscribers: (() => void)[] = []
  for (const table of tables) {
    table.hook('creating', notify)
    table.hook('updating', notify)
    table.hook('deleting', notify)
    unsubscribers.push(() => {
      table.hook('creating').unsubscribe(notify)
      table.hook('updating').unsubscribe(notify)
      table.hook('deleting').unsubscribe(notify)
    })
  }

  const onSettingCreate = (key: unknown) => notifySetting(key)
  const onSettingUpdate = (_mods: unknown, key: unknown) => notifySetting(key)
  db.settings.hook('creating', onSettingCreate)
  db.settings.hook('updating', onSettingUpdate)
  db.settings.hook('deleting', onSettingCreate)
  unsubscribers.push(() => {
    db.settings.hook('creating').unsubscribe(onSettingCreate)
    db.settings.hook('updating').unsubscribe(onSettingUpdate)
    db.settings.hook('deleting').unsubscribe(onSettingCreate)
  })

  return () => unsubscribers.forEach((stop) => stop())
}
