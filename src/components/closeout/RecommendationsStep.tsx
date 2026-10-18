import { SparklesIcon, TriangleAlertIcon, WifiOffIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { RecommendationsView } from '@/hooks/useRecommendationsStep'
import { AI_ERROR_REASONS } from '@/services/ai/aiErrors'
import { AI_PROVIDER_LABELS } from '@/types/ai'
import { RecommendationList } from './RecommendationList'

interface RecommendationsStepProps {
  view: RecommendationsView
  onSend: () => void
  onRetry: () => void
  onUnlock: () => void
}

function Notice({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="grid gap-3">
      <p className="flex items-start gap-2 text-sm">
        {icon}
        <span>{children}</span>
      </p>
    </div>
  )
}

/** Step 3. Skip (in the footer) is always available, so the closeout never depends on AI (AC13.2). */
export function RecommendationsStep({ view, onSend, onRetry, onUnlock }: RecommendationsStepProps) {
  const sparkle = <SparklesIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />

  return (
    <div className="grid gap-3" aria-busy={view.state === 'loading'}>
      <h3 className="font-semibold">Recommendations for tomorrow</h3>

      {view.state === 'loading-settings' ? <Skeleton className="h-16 w-full" /> : null}

      {view.state === 'no-key' ? (
        <>
          <Notice icon={sparkle}>Add an AI key in Settings to get recommendations.</Notice>
          <Button asChild variant="outline" className="min-h-11 justify-self-start">
            <Link to="/settings/ai-security">Open Settings</Link>
          </Button>
        </>
      ) : null}

      {view.state === 'disclosure' ? (
        <>
          <Notice icon={sparkle}>
            To get recommendations, Taskuda sends today’s task titles, statuses, companies, carryovers, and
            your reflection to {AI_PROVIDER_LABELS[view.provider]} using your key. Nothing is sent to Taskuda.
          </Notice>
          <Button className="min-h-11 justify-self-start" onClick={onSend}>
            Send to {AI_PROVIDER_LABELS[view.provider]}
          </Button>
        </>
      ) : null}

      {view.state === 'loading' ? (
        <div className="grid gap-2">
          <p className="text-sm" aria-live="polite">
            Getting recommendations…
          </p>
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : null}

      {view.state === 'results' ? <RecommendationList recommendations={view.recommendations} /> : null}

      {view.state === 'failed' && view.reason === 'offline' ? (
        <Notice icon={<WifiOffIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />}>
          You’re offline, so recommendations aren’t available. You can still finish your closeout.
        </Notice>
      ) : null}

      {view.state === 'failed' && view.reason === 'not-configured' ? (
        <Notice icon={sparkle}>Add an AI key in Settings to get recommendations.</Notice>
      ) : null}

      {view.state === 'failed' && view.reason === 'locked' ? (
        <>
          <Notice icon={sparkle}>Unlock your keys to get recommendations.</Notice>
          <Button className="min-h-11 justify-self-start" onClick={onUnlock}>
            Unlock
          </Button>
        </>
      ) : null}

      {view.state === 'failed' && !['offline', 'not-configured', 'locked'].includes(view.reason) ? (
        <>
          <p role="alert" className="flex items-start gap-2 text-sm">
            <TriangleAlertIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-destructive" />
            <span>
              {AI_PROVIDER_LABELS[view.provider]} didn’t respond:{' '}
              {AI_ERROR_REASONS[view.reason as keyof typeof AI_ERROR_REASONS]}.
            </span>
          </p>
          <Button variant="outline" className="min-h-11 justify-self-start" onClick={onRetry}>
            Try again
          </Button>
        </>
      ) : null}
    </div>
  )
}
