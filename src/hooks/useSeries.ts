import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo } from 'react'
import { db } from '@/services/db/database'
import { getSeries } from '@/services/db/seriesRepository'
import type { RecurringSeries } from '@/types/recurring'

/**
 * One series; `null` when there is none, `undefined` while loading. The result is tagged with the
 * id it was read for, because `useLiveQuery` keeps returning the previous id's result until the new
 * query finishes, and an editor must never start from another task's (or no) series.
 */
export function useSeries(id: string | null | undefined): RecurringSeries | null | undefined {
  const key = id ?? null
  const result = useLiveQuery(
    async () => ({ key, series: key ? ((await getSeries(key)) ?? null) : null }),
    [key],
  )
  return result?.key === key ? result.series : undefined
}

/** Every series by id, for the repeats markers (PRD AC20.2). */
export function useSeriesById(): Map<string, RecurringSeries> {
  const all = useLiveQuery(() => db.recurringSeries.toArray(), [])
  return useMemo(() => new Map((all ?? []).map((s) => [s.id, s])), [all])
}
