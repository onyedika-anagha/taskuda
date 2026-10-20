import { useLiveQuery } from 'dexie-react-hooks'
import { getWorkdaySettings } from '@/services/workday/workdaySettings'
import type { WorkdaySettings } from '@/types/workday'

/** Everything on the Workday settings page (design S7h); `undefined` while loading. */
export function useWorkdaySettings(): WorkdaySettings | undefined {
  return useLiveQuery(() => getWorkdaySettings(), [])
}
