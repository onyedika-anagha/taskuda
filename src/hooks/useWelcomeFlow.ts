import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { listBackupVersions, type BackupVersion } from '@/services/backup/driveBackup'
import {
  getSetupStep,
  isIntroSeen,
  markIntroSeen,
  markSetupDone,
  saveSetupStep,
  type SetupStep,
} from '@/services/onboarding/onboardingProgress'
import { useBackupStore } from '@/stores/backupStore'

export interface WelcomeStep {
  /** `intro` comes first on a new device (PRD FR33) and is never saved as a setup step. */
  name: SetupStep | 'intro'
  /** Backup step only: Drive already holds a backup, so the restore choice shows (design F1.6). */
  latest?: BackupVersion
}

const ALL_SET = 'You’re all set. Press N or + to add your first task.'
const ALL_SET_TOUCH = 'You’re all set. Tap + to add your first task.'

function firstStep(): WelcomeStep['name'] {
  // Resumes where a closed tab left setup, without the intro again (AC34.5).
  return getSetupStep() ?? (isIntroSeen() ? 'companies' : 'intro')
}

/** S1a Intro → S1b Setup: companies → workday → backup (restore if found) → today (design F1). */
export function useWelcomeFlow() {
  const navigate = useNavigate()
  const backupNow = useBackupStore((s) => s.backupNow)
  const touch = useMediaQuery('(pointer: coarse)')
  const [step, setStep] = useState<WelcomeStep>(() => ({ name: firstStep() }))

  // Saved from the first setup step on, so a company added before a closed tab doesn't skip setup.
  useEffect(() => {
    if (step.name !== 'intro') saveSetupStep(step.name)
  }, [step.name])

  function goTo(next: SetupStep) {
    setStep({ name: next })
  }

  /** `announce: false` after a restore, which shows its own toast. */
  function finish({ announce = true } = {}) {
    markSetupDone()
    if (announce) toast.success(touch ? ALL_SET_TOUCH : ALL_SET)
    navigate('/', { replace: true })
  }

  return {
    step,
    /** Skip and Get started (AC33.2–AC33.3). */
    startSetup() {
      markIntroSeen()
      goTo('companies')
    },
    /** "I already use Taskuda": straight to the backup step to restore (PRD RK22). */
    toRestore() {
      markIntroSeen()
      goTo('backup')
    },
    toWorkday: () => goTo('workday'),
    toBackup: () => goTo('backup'),
    /** After connecting: look for an existing backup before making a new one. */
    async afterConnect() {
      try {
        const [latest] = await listBackupVersions()
        if (latest) {
          setStep({ name: 'backup', latest })
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
