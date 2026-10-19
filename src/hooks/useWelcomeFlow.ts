import { useState } from 'react'
import { useNavigate } from 'react-router'
import { listBackupVersions, type BackupVersion } from '@/services/backup/driveBackup'
import { useBackupStore } from '@/stores/backupStore'
import { markWelcomeDone } from './useFirstRun'

export type WelcomeStep =
  | { name: 'company' }
  | { name: 'drive' }
  /** Shown only when Drive already holds a backup (design F1.4). */
  | { name: 'restore'; latest: BackupVersion }

/** S1 Welcome: company → Drive → restore-if-found → today (design F1). */
export function useWelcomeFlow() {
  const navigate = useNavigate()
  const backupNow = useBackupStore((s) => s.backupNow)
  const [step, setStep] = useState<WelcomeStep>({ name: 'company' })

  function finish() {
    markWelcomeDone()
    navigate('/', { replace: true })
  }

  return {
    step,
    stepNumber: step.name === 'company' ? 1 : step.name === 'drive' ? 2 : 3,
    toDrive: () => setStep({ name: 'drive' }),
    /** After connecting: look for an existing backup before making a new one. */
    async afterConnect() {
      try {
        const [latest] = await listBackupVersions()
        if (latest) {
          setStep({ name: 'restore', latest })
          return
        }
      } catch {
        // Can't list: carry on fresh; Settings → Backup can still restore later.
      }
      void backupNow()
      finish()
    },
    startFresh() {
      void backupNow()
      finish()
    },
    finish,
  }
}
