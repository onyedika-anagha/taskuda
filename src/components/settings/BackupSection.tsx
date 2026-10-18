import { DriveBackupPanel } from './DriveBackupPanel'
import { FileBackupPanel } from './FileBackupPanel'

/** S7c Backup. */
export function BackupSection() {
  return (
    <section aria-labelledby="backup-heading" className="grid gap-4">
      <h2 id="backup-heading" className="text-lg font-semibold">
        Backup
      </h2>
      <DriveBackupPanel />
      <FileBackupPanel />
    </section>
  )
}
