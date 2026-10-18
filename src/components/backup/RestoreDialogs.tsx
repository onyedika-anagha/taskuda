import { format } from 'date-fns'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { UnlockDialog } from '@/components/security/UnlockDialog'
import type { useRestoreFlow } from '@/hooks/useRestoreFlow'

type RestoreFlow = ReturnType<typeof useRestoreFlow>

/** D4 Restore Confirm and the D5 unlock that may follow it. */
export function RestoreDialogs({ flow }: { flow: RestoreFlow }) {
  const { stage } = flow
  const backup = stage.name === 'confirm' || stage.name === 'restoring' ? stage.backup : null
  const when = backup ? format(backup.createdAt, 'MMM d, h:mm a') : ''

  return (
    <>
      <ConfirmDialog
        open={stage.name === 'confirm' || stage.name === 'restoring'}
        title="Restore this backup?"
        description={
          <>
            This replaces everything on this device with the backup from {when}.
            {stage.name === 'confirm' && stage.differentDevice ? (
              <>
                {' '}
                <strong>
                  This backup was made on another device (“{stage.backup.deviceName}”). Changes made here
                  since then will be lost.
                </strong>
              </>
            ) : null}
          </>
        }
        confirmLabel={stage.name === 'restoring' ? 'Restoring…' : 'Restore'}
        destructive
        onCancel={flow.cancel}
        onConfirm={() => void flow.confirm()}
      />
      <UnlockDialog
        open={stage.name === 'unlock'}
        onUnlock={flow.unlock}
        onCancel={() => void flow.restoreWithoutKeys()}
        secondaryLabel="Restore without keys"
        wrongPassphraseHint="Try again, or restore without keys and add them again later."
        onSecondary={() => void flow.restoreWithoutKeys()}
      />
    </>
  )
}
