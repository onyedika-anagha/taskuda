import { TABLET_UP } from '@/hooks/useMediaQuery'

export type Viewport = 'phone' | 'tablet' | 'desktop'

const MATCHES: Record<Viewport, Record<string, boolean>> = {
  phone: {},
  tablet: { [TABLET_UP]: true },
  desktop: { [TABLET_UP]: true, '(min-width: 1024px)': true },
}

/** Simulates the media queries the app uses for the given screen class. */
export function setViewport(viewport: Viewport): void {
  window.matchMedia = (query: string) =>
    ({
      matches: !!MATCHES[viewport][query],
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList
}

/** Tablet-and-up (three columns, dialogs) or a phone (tabs, sheets). */
export function setViewportTabletUp(tabletUp: boolean): void {
  setViewport(tabletUp ? 'tablet' : 'phone')
}
