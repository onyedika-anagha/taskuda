import { SETUP_STEPS, type SetupStep } from '@/services/onboarding/onboardingProgress'

const STEP_NAMES: Record<SetupStep, string> = {
  companies: 'Companies',
  workday: 'Workday',
  backup: 'Backup',
}

/** "Step 1 of 3 · Companies" (PRD AC34.1). The page heading, so screen readers hear it first. */
export function SetupStepIndicator({ step }: { step: SetupStep }) {
  const number = SETUP_STEPS.indexOf(step) + 1

  return (
    <h1 aria-live="polite" className="text-sm font-medium text-muted-foreground">
      Step {number} of {SETUP_STEPS.length} · {STEP_NAMES[step]}
    </h1>
  )
}
