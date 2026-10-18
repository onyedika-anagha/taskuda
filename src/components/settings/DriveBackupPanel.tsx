import { useState } from 'react'
import { BackupVersionList } from '@/components/backup/BackupVersionList'
import { RestoreDialogs } from '@/components/backup/RestoreDialogs'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { useBackupVersions } from '@/hooks/useBackupVersions'
import { useDriveConnection } from '@/hooks/useDriveConnection'
import { useNow } from '@/hooks/useNow'
import { useRestoreFlow } from '@/hooks/useRestoreFlow'
import { downloadBackup } from '@/services/backup/driveBackup'
import { useBackupStore } from '@/stores/backupStore'
import { backupStatusText } from '@/utils/backupStatusText'

/** S7c Backup: Google Drive (PRD FR7). */
export function DriveBackupPanel() {
  const status = useBackupStore((s) => s.status)
  const connected = useBackupStore((s) => s.connected)
  const backupNow = useBackupStore((s) => s.backupNow)
  const drive = useDriveConnection()
  const now = useNow()
  const [listOpen, setListOpen] = useState(false)
  const [listError, setListError] = useState<string | null>(null)
  const [confirmDisconnect, setConfirmDisconnect] = useState(false)
  const { versions, load } = useBackupVersions()
  const restore = useRestoreFlow({
    onUnreadable: (message) => setListError(message),
    onDone: () => setListOpen(false),
  })

  function openList() {
    setListError(null)
    setListOpen(true)
    void load()
  }

  return (
    <section aria-labelledby="drive-heading" className="grid gap-3 rounded-lg border bg-card p-4">
      <h3 id="drive-heading" className="font-semibold">
        Google Drive
      </h3>

      {!connected ? (
        <>
          <p className="text-sm">
            Your data is only on this device. Connect Google Drive to back it up. Taskuda can only see its own
            backup file, not your other Drive files.
          </p>
          {drive.error ? (
            <p role="alert" className="text-sm font-medium text-destructive">
              {drive.error}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button className="min-h-11" disabled={drive.connecting} onClick={() => void drive.connect()}>
              {drive.connecting ? 'Connecting…' : 'Connect Google Drive'}
            </Button>
            <Button variant="outline" className="min-h-11" onClick={openList}>
              Restore from Drive
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm" aria-live="polite">
            {status.state === 'failed'
              ? `Backup failed: ${status.reason}. Your data is still safe on this device.`
              : status.state === 'reconnect'
                ? 'Your Google session expired. Reconnect to keep backing up.'
                : status.state === 'offline'
                  ? 'Offline · changes are saved on this device and back up when you’re online.'
                  : backupStatusText(status, now)}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              className="min-h-11"
              disabled={status.state === 'backing-up'}
              onClick={() => void backupNow({ interactive: true })}
            >
              {status.state === 'reconnect'
                ? 'Reconnect Google'
                : status.state === 'failed'
                  ? 'Try again'
                  : 'Back up now'}
            </Button>
            <Button variant="outline" className="min-h-11" onClick={openList}>
              Restore from Drive
            </Button>
            <Button variant="ghost" className="min-h-11" onClick={() => setConfirmDisconnect(true)}>
              Disconnect
            </Button>
          </div>
        </>
      )}

      <BackupVersionList
        open={listOpen && restore.stage.name === 'idle'}
        versions={versions}
        error={listError}
        onRetry={() => void load()}
        onClose={() => setListOpen(false)}
        onPick={(version) => {
          setListError(null)
          void restore.start(() => downloadBackup(version.id))
        }}
      />
      <RestoreDialogs flow={restore} />
      <ConfirmDialog
        open={confirmDisconnect}
        title="Disconnect Google Drive?"
        description="Taskuda stops backing up. Your data stays on this device, and existing backups stay in your Drive."
        confirmLabel="Disconnect"
        onCancel={() => setConfirmDisconnect(false)}
        onConfirm={() => {
          setConfirmDisconnect(false)
          void drive.disconnect()
        }}
      />
    </section>
  )
}
