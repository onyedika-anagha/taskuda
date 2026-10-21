import { CheckIcon } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { useInstallPrompt } from '@/hooks/useInstallPrompt'
import { useInstallStore } from '@/stores/installStore'

/** S7g About: version, install, the intro again (PRD AC33.4), privacy summary. */
export function AboutSection() {
  const navigate = useNavigate()
  const { canInstall, install } = useInstallPrompt()
  const installed = useInstallStore((s) => s.installed)

  return (
    <section aria-labelledby="about-heading" className="grid gap-4">
      <h2 id="about-heading" className="text-lg font-semibold">
        About
      </h2>
      <div className="grid gap-3 rounded-lg border bg-card p-4 text-sm">
        <p>
          <span className="font-medium">Taskuda</span> · Version {__APP_VERSION__}
        </p>
        <p>
          Your data stays on your device and in your own Google Drive. Taskuda has no server that stores your
          tasks or keys.
        </p>
        <p className="text-muted-foreground">
          AI recommendations go straight from your browser to the AI provider you choose, using your own key.
        </p>
        {canInstall ? (
          <Button className="min-h-11 justify-self-start" onClick={() => void install()}>
            Install Taskuda
          </Button>
        ) : installed ? (
          <p className="flex items-center gap-1.5">
            <CheckIcon aria-hidden="true" className="size-4" />
            Taskuda is installed on this device.
          </p>
        ) : null}
        <Button variant="outline" className="min-h-11 justify-self-start" onClick={() => navigate('/intro')}>
          Show intro again
        </Button>
      </div>
    </section>
  )
}
