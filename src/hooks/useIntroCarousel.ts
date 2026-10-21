import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import { useSwipe } from '@/hooks/useSwipe'

export const INTRO_HEADING_ID = 'intro-slide-heading'

/**
 * S1a slides (PRD AC33.2): Next/Back, dots, ←/→ and swipe. Never advances on its own. When the
 * slide changes, focus moves to the new slide's heading (design Section 7).
 */
export function useIntroCarousel(count: number) {
  const [index, setIndex] = useState(0)

  function goTo(next: number) {
    if (next < 0 || next >= count || next === index) return
    flushSync(() => setIndex(next))
    document.getElementById(INTRO_HEADING_ID)?.focus()
  }

  // ←/→ anywhere on the page: the intro is the whole screen while it shows.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return
      const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
      const next = index + step
      if (!step || next < 0 || next >= count) return
      event.preventDefault()
      flushSync(() => setIndex(next))
      document.getElementById(INTRO_HEADING_ID)?.focus()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [index, count])

  const swipe = useSwipe(
    () => goTo(index + 1),
    () => goTo(index - 1),
  )

  return {
    index,
    isFirst: index === 0,
    isLast: index === count - 1,
    next: () => goTo(index + 1),
    back: () => goTo(index - 1),
    goTo,
    swipe,
  }
}
