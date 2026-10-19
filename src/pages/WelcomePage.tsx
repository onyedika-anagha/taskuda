import { RestoreDialogs } from '@/components/backup/RestoreDialogs'
import { CompanyStep } from '@/components/welcome/CompanyStep'
import { DriveStep } from '@/components/welcome/DriveStep'
import { RestoreStep } from '@/components/welcome/RestoreStep'
import { useDriveConnection } from '@/hooks/useDriveConnection'
import { useRestoreFlow } from '@/hooks/useRestoreFlow'
import { useWelcomeFlow } from '@/hooks/useWelcomeFlow'
import { downloadBackup } from '@/services/backup/driveBackup'

/** S1 Welcome (first run only). */
export function WelcomePage() {
  const flow = useWelcomeFlow()
  const drive = useDriveConnection()
  const restore = useRestoreFlow({ onDone: flow.finish })
  const { step } = flow

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-6 px-4 py-10">
      <div className="grid gap-2">
        <p className="text-sm font-bold tracking-tight">Taskuda</p>
        <h1 className="text-3xl font-semibold tracking-tight">Plan your day across every job.</h1>
        <p className="text-muted-foreground">
          Sticky notes for each employer, and a ready-to-send report at the end of the day.
        </p>
      </div>

      <p className="text-xs font-medium text-muted-foreground" aria-live="polite">
        Step {flow.stepNumber} of 3
      </p>

      {step.name === 'company' ? <CompanyStep onDone={flow.toDrive} /> : null}
      {step.name === 'drive' ? (
        <DriveStep
          connecting={drive.connecting}
          error={drive.error}
          onSkip={flow.finish}
          onConnect={() =>
            void drive.connect({ backupNow: false }).then((connected) => {
              if (connected) void flow.afterConnect()
            })
          }
        />
      ) : null}
      {step.name === 'restore' ? (
        <RestoreStep
          latest={step.latest}
          busy={restore.stage.name !== 'idle'}
          onStartFresh={flow.startFresh}
          onRestore={() => void restore.start(() => downloadBackup(step.latest.id))}
        />
      ) : null}
      <RestoreDialogs flow={restore} />
    </main>
  )
}
