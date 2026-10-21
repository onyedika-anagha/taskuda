import { RestoreDialogs } from '@/components/backup/RestoreDialogs'
import { CompanyStep } from '@/components/welcome/CompanyStep'
import { DriveStep } from '@/components/welcome/DriveStep'
import { RestoreStep } from '@/components/welcome/RestoreStep'
import { SetupStepIndicator } from '@/components/welcome/SetupStepIndicator'
import { WorkdayStep } from '@/components/welcome/WorkdayStep'
import { useDriveConnection } from '@/hooks/useDriveConnection'
import { useRestoreFlow } from '@/hooks/useRestoreFlow'
import { useWelcomeFlow } from '@/hooks/useWelcomeFlow'
import { downloadBackup } from '@/services/backup/driveBackup'

/** S1b Setup (first run only): composes the steps. */
export function WelcomePage() {
  const flow = useWelcomeFlow()
  const drive = useDriveConnection()
  const restore = useRestoreFlow({ onDone: () => flow.finish({ announce: false }) })
  const { step } = flow

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-6 px-4 py-10">
      <div className="grid gap-1">
        <p className="text-sm font-bold tracking-tight">Taskuda</p>
        <SetupStepIndicator step={step.name} />
      </div>

      {step.name === 'companies' ? <CompanyStep onDone={flow.toWorkday} /> : null}
      {step.name === 'workday' ? <WorkdayStep onDone={flow.toBackup} /> : null}
      {step.name === 'backup' && !step.latest ? (
        <DriveStep
          connecting={drive.connecting}
          error={drive.error}
          onSkip={() => flow.finish()}
          onConnect={() =>
            void drive.connect({ backupNow: false }).then((connected) => {
              if (connected) void flow.afterConnect()
            })
          }
        />
      ) : null}
      {step.name === 'backup' && step.latest ? (
        <RestoreStep
          latest={step.latest}
          busy={restore.stage.name !== 'idle'}
          onStartFresh={flow.startFresh}
          onRestore={() => void restore.start(() => downloadBackup(step.latest!.id))}
        />
      ) : null}
      <RestoreDialogs flow={restore} />
    </main>
  )
}
