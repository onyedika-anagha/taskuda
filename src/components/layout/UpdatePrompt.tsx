import { useEffect } from 'react'
import { toast } from 'sonner'
import { registerServiceWorker } from '@/services/pwa/serviceWorker'

/** Registers the service worker and offers "Reload" when a new version is waiting (design F13.3). */
export function UpdatePrompt() {
  useEffect(() => {
    registerServiceWorker((reload) => {
      toast('Taskuda updated. Reload to get the latest version.', {
        duration: Infinity,
        action: { label: 'Reload', onClick: () => void reload() },
      })
    })
  }, [])
  return null
}
