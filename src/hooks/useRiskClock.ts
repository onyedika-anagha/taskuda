import { useEffect, useState } from 'react'

const TICK_MS = 60_000

/**
 * The time at-risk markers are worked out from: refreshed every minute and as soon as the tab is
 * visible again, so a device waking from sleep never shows stale markers (PRD AC31.6, DAC23).
 */
export function useRiskClock(): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const refresh = () => setNow(Date.now())
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    const id = setInterval(refresh, TICK_MS)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return now
}
