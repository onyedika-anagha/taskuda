import { Button } from '@/components/ui/button'
import { StepCard } from './StepCard'

interface DriveStepProps {
  connecting: boolean
  error: string | null
  onConnect: () => void
  onSkip: () => void
}

/** Step 2: back up to Drive (design F1.3). */
export function DriveStep({ connecting, error, onConnect, onSkip }: DriveStepProps) {
  return (
    <StepCard
      title="Back up to Google Drive"
      description="Your tasks are saved on this device. Back them up to your own Drive so you never lose them."
    >
      {error ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" size="lg" onClick={onSkip}>
          {error ? 'Skip' : 'Not now'}
        </Button>
        <Button size="lg" disabled={connecting} onClick={onConnect}>
          {connecting ? 'Connecting…' : error ? 'Try again' : 'Connect Google Drive'}
        </Button>
      </div>
    </StepCard>
  )
}
