import { useRef, type TouchEvent } from 'react'

const MIN_DISTANCE = 60

/** Horizontal swipe handlers; vertical scrolling is ignored. */
export function useSwipe(onSwipeLeft: () => void, onSwipeRight: () => void) {
  const start = useRef<{ x: number; y: number } | null>(null)

  return {
    onTouchStart(event: TouchEvent) {
      const touch = event.touches[0]
      start.current = { x: touch.clientX, y: touch.clientY }
    },
    onTouchEnd(event: TouchEvent) {
      if (!start.current) return
      const touch = event.changedTouches[0]
      const dx = touch.clientX - start.current.x
      const dy = touch.clientY - start.current.y
      start.current = null
      if (Math.abs(dx) < MIN_DISTANCE || Math.abs(dx) < Math.abs(dy) * 1.5) return
      if (dx < 0) onSwipeLeft()
      else onSwipeRight()
    },
  }
}
