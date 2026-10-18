import { WifiOffIcon, XIcon } from 'lucide-react'
import { useState } from 'react'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'

function OfflineNotice() {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  return (
    <div
      aria-live="polite"
      className="flex items-center gap-2 bg-secondary px-4 py-1.5 text-sm text-secondary-foreground"
    >
      <WifiOffIcon aria-hidden="true" className="size-4 shrink-0" />
      <p className="flex-1">You’re offline. Everything still saves on this device.</p>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="grid size-11 place-items-center rounded-md outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
      >
        <XIcon aria-hidden="true" className="size-4" />
      </button>
    </div>
  )
}

/**
 * Thin, dismissible notice while offline (NFR1). The notice remounts on each new
 * offline period, so dismissing it only hides it until the connection drops again.
 */
export function OfflineBanner() {
  const online = useOnlineStatus()
  return online ? null : <OfflineNotice />
}
