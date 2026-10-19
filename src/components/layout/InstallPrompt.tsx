import { DownloadIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useInstallPrompt } from '@/hooks/useInstallPrompt'

/** "Install Taskuda" banner under the app bar (design InstallPrompt, F13). */
export function InstallPrompt() {
  const { showBanner, install, notNow } = useInstallPrompt()
  if (!showBanner) return null

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card px-4 py-2 text-sm">
      <DownloadIcon aria-hidden="true" className="size-4 shrink-0" />
      <p className="flex-1">Install Taskuda for one-click access.</p>
      <Button size="sm" className="min-h-11" onClick={() => void install()}>
        Install
      </Button>
      <Button size="sm" variant="ghost" className="min-h-11" onClick={notNow}>
        Not now
      </Button>
    </div>
  )
}
