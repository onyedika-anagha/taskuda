import { useEyeBreakTicks } from '@/hooks/useEyeBreakTicks'
import { useScreenTimeTracking } from '@/hooks/useScreenTimeTracking'

/** Eye breaks (PRD FR28) and time in Taskuda with its budget (FR29). Renders nothing; mount once. */
export function WellbeingScheduler() {
  useEyeBreakTicks()
  useScreenTimeTracking()
  return null
}
