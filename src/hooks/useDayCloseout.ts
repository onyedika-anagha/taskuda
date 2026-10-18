import { useLiveQuery } from 'dexie-react-hooks'
import { getCloseout } from '@/services/db/closeoutRepository'
import type { Closeout } from '@/types/closeout'

/** The saved closeout for a day; `null` if not closed, `undefined` while loading. */
export function useDayCloseout(dayKey: string): Closeout | null | undefined {
  return useLiveQuery(async () => (await getCloseout(dayKey)) ?? null, [dayKey])
}
