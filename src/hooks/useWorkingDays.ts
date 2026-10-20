import { useLiveQuery } from 'dexie-react-hooks'
import { getWorkingDays } from '@/services/workday/workdaySettings'
import type { Weekday } from '@/types/workday'

/** The user's working days (PRD FR19); `undefined` while loading. */
export function useWorkingDays(): Weekday[] | undefined {
  return useLiveQuery(() => getWorkingDays(), [])
}
