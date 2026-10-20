import type { Task } from '@/types/task'
import { windowStart } from './metrics'

/** "Needs attention" thresholds (PRD AC26.2). */
export const ATTENTION_MIN_TASKS = 5
export const ATTENTION_MIN_RATE = 0.3
/** Open tasks carried this many times or more are listed (PRD AC26.3). */
export const REPEATED_CARRY_COUNT = 3

export interface CarryoverRate {
  /** `null` for tasks without a company. */
  companyId: string | null
  total: number
  carried: number
  /** 0–1. */
  rate: number
}

export interface CarryoverInsights {
  /** `null` when there are no past tasks in the window (AC26.4 empty state). */
  overall: CarryoverRate | null
  /** Highest rate first. */
  byCompany: CarryoverRate[]
  needsAttention: CarryoverRate[]
  /** Open tasks carried 3+ times, most carried first. */
  repeatedlyCarried: Task[]
}

function rateOf(companyId: string | null, tasks: Task[]): CarryoverRate {
  const carried = tasks.filter((t) => t.carriedToTaskId !== null).length
  return { companyId, total: tasks.length, carried, rate: tasks.length ? carried / tasks.length : 0 }
}

/**
 * FR26: the share of tasks on past days in the 4-week window that were carried over, per company
 * and overall (AC26.1), the companies that need attention (AC26.2), and the open tasks that keep
 * getting carried over (AC26.3).
 */
export function carryoverInsights(tasks: Task[], todayKey: string): CarryoverInsights {
  const start = windowStart(todayKey)
  const past = tasks.filter((t) => t.dayKey >= start && t.dayKey < todayKey)

  const groups = new Map<string | null, Task[]>()
  for (const task of past) {
    const group = groups.get(task.companyId)
    if (group) group.push(task)
    else groups.set(task.companyId, [task])
  }
  const byCompany = [...groups].map(([id, group]) => rateOf(id, group)).sort((a, b) => b.rate - a.rate)

  return {
    overall: past.length ? rateOf(null, past) : null,
    byCompany,
    needsAttention: byCompany.filter(
      (r) => r.companyId !== null && r.total >= ATTENTION_MIN_TASKS && r.rate >= ATTENTION_MIN_RATE,
    ),
    repeatedlyCarried: tasks
      .filter(
        (t) =>
          t.status !== 'done' && t.carriedToTaskId === null && t.carriedOverCount >= REPEATED_CARRY_COUNT,
      )
      .sort((a, b) => b.carriedOverCount - a.carriedOverCount),
  }
}
