import { useEffect } from 'react'
import { addScreenTime } from '@/services/db/screenTimeRepository'
import { checkBudget } from '@/services/screenTime/budgetAlerts'
import { createScreenTimeTracker } from '@/services/screenTime/screenTimeTracker'

/** Saved this often while visible (PRD AC29.1: at least once a minute). */
export const SCREEN_TIME_FLUSH_MS = 30_000

/** Records visible time on this device and checks the daily budget after each save (PRD FR29). */
export function useScreenTimeTracking(): void {
  useEffect(() => {
    const tracker = createScreenTimeTracker(addScreenTime)
    const isVisible = () => document.visibilityState === 'visible'
    // Storage errors are ignored: losing a minute of in-app time is harmless.
    const flush = () =>
      void tracker
        .flush(Date.now())
        .then(() => checkBudget())
        .catch(() => {})
    const onVisibility = () => {
      if (isVisible()) tracker.start(Date.now())
      else void tracker.stop(Date.now()).catch(() => {})
    }
    const onPageHide = () => void tracker.stop(Date.now()).catch(() => {})

    if (isVisible()) tracker.start(Date.now())
    const interval = setInterval(flush, SCREEN_TIME_FLUSH_MS)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', onPageHide)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', onPageHide)
      void tracker.stop(Date.now()).catch(() => {})
    }
  }, [])
}
