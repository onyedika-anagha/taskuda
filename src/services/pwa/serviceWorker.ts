import { registerSW } from 'virtual:pwa-register'

let registered = false

/**
 * Registers the service worker once. `onNeedRefresh` gets a function that activates the waiting
 * version and reloads, so a new release is picked up with one reload (PRD AC16.2).
 */
export function registerServiceWorker(onNeedRefresh: (reload: () => Promise<void>) => void): void {
  if (registered || !('serviceWorker' in navigator)) return
  registered = true
  const updateServiceWorker = registerSW({
    onNeedRefresh: () => onNeedRefresh(() => updateServiceWorker(true)),
  })
}
