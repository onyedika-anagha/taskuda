import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import type { BackupVersion } from '@/services/backup/driveBackup'
import { StepCard } from './StepCard'

interface RestoreStepProps {
  latest: BackupVersion
  busy: boolean
  onRestore: () => void
  onStartFresh: () => void
}

/** Step 3: offered only when Drive already has a backup (design F1.4). */
export function RestoreStep({ latest, busy, onRestore, onStartFresh }: RestoreStepProps) {
  return (
    <StepCard
      title={`Found a backup from ${format(latest.createdAt, 'MMM d')}`}
      description="Restore it to pick up where you left off?"
    >
      <p className="text-sm">
        Made {format(latest.createdAt, 'EEE, MMM d · h:mm a')} on {latest.deviceName}.
      </p>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" size="lg" onClick={onStartFresh}>
          Start fresh
        </Button>
        <Button size="lg" disabled={busy} onClick={onRestore}>
          Restore
        </Button>
      </div>
    </StepCard>
  )
}
