import { useCallback, useSyncExternalStore } from 'react'

/** Tablet and up: three columns and dialogs instead of tabs and sheets (design spec Section 6). */
export const TABLET_UP = '(min-width: 768px)'

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (callback: () => void) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', callback)
      return () => list.removeEventListener('change', callback)
    },
    [query],
  )
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  )
}
