import { useMemo } from 'react'
import type { AtRiskTask, RiskKind } from '@/types/risk'
import type { Task } from '@/types/task'
import { todayKey } from '@/utils/dates'
import { atRiskTasks } from '@/utils/taskRisk'
import { useRiskClock } from './useRiskClock'

export interface TaskRisks {
  /** Task id → its marker (PRD FR31). Tasks with no risk are absent. */
  byId: Map<string, RiskKind>
  /** D9 rows, in the AC32.3 order. */
  atRisk: AtRiskTask<Task>[]
  done: number
  total: number
  /** Today's day key at the same moment, for labels ("Due today"). */
  today: string
}

/** At-risk states and progress for one day's tasks, recomputed as time passes (PRD FR31, FR32). */
export function useTaskRisks(tasks: Task[]): TaskRisks {
  const now = useRiskClock()
  return useMemo(() => {
    const atRisk = atRiskTasks(tasks, now)
    return {
      byId: new Map(atRisk.map(({ task, kind }) => [task.id, kind])),
      atRisk,
      done: tasks.filter((t) => t.status === 'done').length,
      total: tasks.length,
      today: todayKey(new Date(now)),
    }
  }, [tasks, now])
}
