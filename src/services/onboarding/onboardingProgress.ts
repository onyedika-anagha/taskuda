import { readLocal, removeLocal, writeLocal } from '@/utils/safeStorage'

/** The setup steps that are saved, so setup resumes after a closed tab (PRD AC34.5). */
export const SETUP_STEPS = ['companies', 'workday', 'backup'] as const
export type SetupStep = (typeof SETUP_STEPS)[number]

/** Kept from before onboarding had steps, so devices that finished it stay finished. */
const SETUP_DONE_KEY = 'taskuda.welcomeDone'
const SETUP_STEP_KEY = 'taskuda.setupStep'
const INTRO_SEEN_KEY = 'taskuda.introSeen'

/** Per device, in localStorage: onboarding describes this device, so it's never backed up. */
export function isSetupDone(): boolean {
  return readLocal(SETUP_DONE_KEY) === '1'
}

export function markSetupDone(): void {
  writeLocal(SETUP_DONE_KEY, '1')
  removeLocal(SETUP_STEP_KEY)
}

/** The step setup was left on, or `null` when setup isn't in progress. */
export function getSetupStep(): SetupStep | null {
  const step = readLocal(SETUP_STEP_KEY)
  return SETUP_STEPS.find((s) => s === step) ?? null
}

export function saveSetupStep(step: SetupStep): void {
  writeLocal(SETUP_STEP_KEY, step)
}

export function isIntroSeen(): boolean {
  return readLocal(INTRO_SEEN_KEY) === '1'
}

export function markIntroSeen(): void {
  writeLocal(INTRO_SEEN_KEY, '1')
}
