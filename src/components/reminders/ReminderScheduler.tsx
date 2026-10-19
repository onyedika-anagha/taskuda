import { useReminderTicks } from '@/hooks/useReminderTicks'

/** Runs reminder checks while the app is open (PRD FR9). Renders nothing; mount once. */
export function ReminderScheduler() {
  useReminderTicks()
  return null
}
