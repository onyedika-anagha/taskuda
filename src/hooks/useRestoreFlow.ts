import { format } from 'date-fns'
import { useState } from 'react'
import { toast } from 'sonner'
import type { BackupFile } from '@/schemas/backupFile'
import { BackupUnreadableError, restoreBackupFile } from '@/services/backup/backupSnapshot'
import { getDeviceId } from '@/services/backup/deviceInfo'
import { useVaultStore } from '@/stores/vaultStore'

export type RestoreStage =
  | { name: 'idle' }
  | { name: 'loading' }
  | { name: 'confirm'; backup: BackupFile; differentDevice: boolean }
  | { name: 'restoring'; backup: BackupFile }
  /** Restored, but the backup's keys need the passphrase on this device (design F8.3). */
  | { name: 'unlock'; backup: BackupFile }

const restoredMessage = (backup: BackupFile) =>
  `Restored backup from ${format(backup.createdAt, 'MMM d, h:mm a')}`

/** Choose → confirm (D4) → restore → unlock (D5) or restore without keys. Used for Drive and file imports. */
export function useRestoreFlow(
  options: { onUnreadable?: (message: string) => void; onDone?: () => void } = {},
) {
  const [stage, setStage] = useState<RestoreStage>({ name: 'idle' })
  const refreshVault = useVaultStore((s) => s.refresh)
  const unlockVault = useVaultStore((s) => s.unlock)
  const resetSecrets = useVaultStore((s) => s.resetSecrets)

  function finish(message: string) {
    setStage({ name: 'idle' })
    toast.success(message)
    options.onDone?.()
  }

  return {
    stage,

    async start(load: () => Promise<BackupFile>) {
      setStage({ name: 'loading' })
      try {
        const [backup, deviceId] = await Promise.all([load(), getDeviceId()])
        setStage({ name: 'confirm', backup, differentDevice: backup.deviceId !== deviceId })
      } catch (error) {
        setStage({ name: 'idle' })
        const message =
          error instanceof BackupUnreadableError
            ? error.message
            : 'Couldn’t download this backup. Check your connection and try again.'
        if (options.onUnreadable) options.onUnreadable(message)
        else toast.error(message)
      }
    },

    async confirm() {
      if (stage.name !== 'confirm') return
      const { backup } = stage
      setStage({ name: 'restoring', backup })
      try {
        const { hasSecrets } = await restoreBackupFile(backup)
        await refreshVault()
        if (hasSecrets && useVaultStore.getState().status === 'locked') setStage({ name: 'unlock', backup })
        else finish(restoredMessage(backup))
      } catch {
        setStage({ name: 'idle' })
        toast.error('Couldn’t restore this backup. Nothing on this device was changed.')
      }
    },

    async unlock(passphrase: string) {
      if (stage.name !== 'unlock') return
      await unlockVault(passphrase)
      finish(restoredMessage(stage.backup))
    },

    async restoreWithoutKeys() {
      if (stage.name !== 'unlock') return
      await resetSecrets()
      finish(`${restoredMessage(stage.backup)}. Add your AI key and Jira token again in Settings.`)
    },

    // Ignored while restoring: the confirm dialog also reports 'closed' when Restore is pressed.
    cancel: () => setStage((current) => (current.name === 'restoring' ? current : { name: 'idle' })),
  }
}
