import { useEffect } from 'react'
import { db } from '@/services/db/database'
import { useCalendarStore } from '@/stores/calendarStore'

/** Pull/push every 5 minutes while the app is open (there's no background sync without a server). */
const INTERVAL_MS = 5 * 60_000

/**
 * Runs Calendar sync while the app is open (design F9.2): on open, when the tab regains focus,
 * every 5 minutes, and shortly after task changes. Renders nothing; mount once.
 */
export function CalendarSyncScheduler() {
  const init = useCalendarStore((s) => s.init)
  const syncNow = useCalendarStore((s) => s.syncNow)
  const scheduleSync = useCalendarStore((s) => s.scheduleSync)

  useEffect(() => {
    const onTaskChange = () => queueMicrotask(scheduleSync)
    db.tasks.hook('creating', onTaskChange)
    db.tasks.hook('updating', onTaskChange)
    db.tasks.hook('deleting', onTaskChange)
    const onFocus = () => {
      if (document.visibilityState === 'visible') void syncNow()
    }
    document.addEventListener('visibilitychange', onFocus)
    window.addEventListener('online', onFocus)
    const interval = setInterval(onFocus, INTERVAL_MS)
    void init().then(() => syncNow())

    return () => {
      db.tasks.hook('creating').unsubscribe(onTaskChange)
      db.tasks.hook('updating').unsubscribe(onTaskChange)
      db.tasks.hook('deleting').unsubscribe(onTaskChange)
      document.removeEventListener('visibilitychange', onFocus)
      window.removeEventListener('online', onFocus)
      clearInterval(interval)
    }
  }, [init, syncNow, scheduleSync])

  return null
}
