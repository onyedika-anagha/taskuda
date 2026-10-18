import { format } from 'date-fns'
import { ResponsiveDialog } from '@/components/common/ResponsiveDialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { VersionsState } from '@/hooks/useBackupVersions'
import type { BackupVersion } from '@/services/backup/driveBackup'

interface BackupVersionListProps {
  open: boolean
  versions: VersionsState
  /** Shown above the list, e.g. "This backup can't be read. Try an older version." */
  error: string | null
  onPick: (version: BackupVersion) => void
  onRetry: () => void
  onClose: () => void
}

/** Pick a Drive backup version to restore (design F8.1). */
export function BackupVersionList({
  open,
  versions,
  error,
  onPick,
  onRetry,
  onClose,
}: BackupVersionListProps) {
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title="Restore from Google Drive"
      description="Pick the backup to restore. The newest is first."
    >
      <div className="grid gap-3">
        {error ? (
          <p role="alert" className="text-sm font-medium text-destructive">
            {error}
          </p>
        ) : null}
        {versions.state === 'loading' || versions.state === 'idle' ? (
          <div className="grid gap-2" aria-busy="true">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : null}
        {versions.state === 'failed' ? (
          <>
            <p role="alert" className="text-sm">
              {versions.message}
            </p>
            <Button variant="outline" className="min-h-11 justify-self-start" onClick={onRetry}>
              Try again
            </Button>
          </>
        ) : null}
        {versions.state === 'loaded' && versions.versions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No backups in your Google Drive yet.</p>
        ) : null}
        {versions.state === 'loaded' && versions.versions.length > 0 ? (
          <ul className="grid gap-2">
            {versions.versions.map((version) => (
              <li key={version.id}>
                <button
                  type="button"
                  onClick={() => onPick(version)}
                  className="flex min-h-12 w-full flex-col items-start rounded-lg border bg-card px-3 py-2 text-left outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="font-medium">{format(version.createdAt, 'EEE, MMM d · h:mm a')}</span>
                  <span className="text-xs text-muted-foreground">
                    {version.deviceName}
                    {version.fromThisDevice ? ' (this device)' : ''}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </ResponsiveDialog>
  )
}
