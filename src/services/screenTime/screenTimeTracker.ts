import { toDayKey } from '@/utils/dates'

/** Splits `from`–`to` (ms) into time per local day, so a session past midnight counts on both days. */
export function splitByDay(from: number, to: number): Map<string, number> {
  const result = new Map<string, number>()
  let cursor = from
  while (cursor < to) {
    const nextMidnight = new Date(cursor)
    nextMidnight.setHours(24, 0, 0, 0)
    const end = Math.min(to, nextMidnight.getTime())
    const day = toDayKey(new Date(cursor))
    result.set(day, (result.get(day) ?? 0) + (end - cursor))
    cursor = end
  }
  return result
}

export interface ScreenTimeTracker {
  /** Taskuda became visible. */
  start: (at: number) => void
  /** Saves the visible time so far and keeps counting. */
  flush: (at: number) => Promise<void>
  /** Taskuda was hidden or closed: saves and stops counting. */
  stop: (at: number) => Promise<void>
}

/**
 * Counts only the time Taskuda is visible on screen (PRD AC29.1). The caller calls `flush` at
 * least once a minute and `stop` when the page is hidden, so little is lost if the tab is killed.
 */
export function createScreenTimeTracker(
  save: (byDay: Map<string, number>) => Promise<void>,
): ScreenTimeTracker {
  let visibleSince: number | null = null

  const saveUntil = (at: number) => {
    if (visibleSince === null || at <= visibleSince) return Promise.resolve()
    const span = splitByDay(visibleSince, at)
    visibleSince = at
    return save(span)
  }

  return {
    start: (at) => {
      if (visibleSince === null) visibleSince = at
    },
    flush: (at) => saveUntil(at),
    stop: async (at) => {
      const saving = saveUntil(at)
      visibleSince = null
      await saving
    },
  }
}
