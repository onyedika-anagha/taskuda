import { useEffect, useRef } from 'react'

/**
 * Calls `onExpire` once after `durationMs` of time spent not paused. Pausing keeps the time already
 * used, so hovering or focusing for a while doesn't restart the countdown.
 */
export function usePausableTimeout(durationMs: number, paused: boolean, onExpire: () => void): void {
  const remaining = useRef(durationMs)
  const onExpireRef = useRef(onExpire)

  useEffect(() => {
    onExpireRef.current = onExpire
  }, [onExpire])

  useEffect(() => {
    if (paused || remaining.current <= 0) return
    const startedAt = Date.now()
    const id = setTimeout(() => {
      remaining.current = 0
      onExpireRef.current()
    }, remaining.current)
    return () => {
      clearTimeout(id)
      remaining.current = Math.max(0, remaining.current - (Date.now() - startedAt))
    }
  }, [paused])
}
