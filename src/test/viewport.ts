import { TABLET_UP } from '@/hooks/useMediaQuery'

/** Simulates the tablet-and-up media query (three columns, dialogs) or a phone (tabs, sheets). */
export function setViewportTabletUp(tabletUp: boolean): void {
  window.matchMedia = (query: string) =>
    ({
      matches: query === TABLET_UP ? tabletUp : false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList
}
