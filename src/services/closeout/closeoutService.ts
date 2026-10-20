import { getCloseout, saveCloseout } from '@/services/db/closeoutRepository'
import { db } from '@/services/db/database'
import { ValidationError } from '@/services/db/errors'
import { deleteSetting, getSetting, setSetting } from '@/services/db/settingsRepository'
import { carryOverTask, deleteTask, listTasksForDay } from '@/services/db/taskRepository'
import { getWorkingDays } from '@/services/workday/workdaySettings'
import type { Closeout } from '@/types/closeout'
import type { CloseoutDraft } from '@/types/closeoutDraft'
import { relevantOutcomes, unfinishedTasks } from '@/utils/closeoutRules'
import { nextWorkingDay } from '@/utils/dates'

const draftKey = (dayKey: string) => `closeout.draft.${dayKey}`

export function newDraft(dayKey: string, now = Date.now()): CloseoutDraft {
  return {
    dayKey,
    step: 'unfinished',
    startedAt: now,
    outcomes: {},
    rating: null,
    reflection: '',
    reportCopiedAt: null,
    recommendations: null,
  }
}

export function loadDraft(dayKey: string): Promise<CloseoutDraft | null> {
  return getSetting<CloseoutDraft | null>(draftKey(dayKey), null)
}

export function saveDraft(draft: CloseoutDraft): Promise<void> {
  return setSetting(draftKey(draft.dayKey), draft)
}

export function discardDraft(dayKey: string): Promise<void> {
  return deleteSetting(draftKey(dayKey))
}

export interface FinishResult {
  carried: number
  /** The day carried tasks went to. */
  carriedTo: string
  deleted: number
  closeout: Closeout
}

/**
 * Applies every decision and records the closeout in one transaction, so a crash can't
 * leave tasks half-carried (PRD AC10.1, AC10.3, AC11.1). Unfinished tasks go to the next
 * working day (AC19.3).
 */
export async function finishCloseout(draft: CloseoutDraft, now = Date.now()): Promise<FinishResult> {
  if (draft.rating === null || draft.rating < 1 || draft.rating > 5) {
    throw new ValidationError('Pick a rating to continue.')
  }
  const rating = draft.rating

  return db.transaction(
    'rw',
    [db.tasks, db.activityLog, db.calendarMappings, db.closeouts, db.settings],
    async () => {
      const tasks = await listTasksForDay(draft.dayKey)
      const outcomes = relevantOutcomes(tasks, draft.outcomes)
      const undecided = unfinishedTasks(tasks).filter((t) => !outcomes[t.id])
      if (undecided.length) {
        throw new ValidationError(
          `${undecided.length} ${undecided.length === 1 ? 'task still needs' : 'tasks still need'} a decision`,
        )
      }

      const nextDay = nextWorkingDay(draft.dayKey, await getWorkingDays())
      let carried = 0
      let deleted = 0
      for (const [taskId, outcome] of Object.entries(outcomes)) {
        if (outcome === 'carry_over') {
          await carryOverTask(taskId, nextDay)
          carried++
        } else {
          await deleteTask(taskId)
          deleted++
        }
      }

      const previous = await getCloseout(draft.dayKey)
      // Closing out the same day again keeps the first closeout's timing, so M3 measures the first report.
      const timing = previous?.reportCopiedAt
        ? { startedAt: previous.startedAt, reportCopiedAt: previous.reportCopiedAt }
        : { startedAt: draft.startedAt, reportCopiedAt: draft.reportCopiedAt }
      const closeout: Closeout = {
        dayKey: draft.dayKey,
        ...timing,
        finishedAt: now,
        rating,
        reflection: draft.reflection.trim(),
        outcomes: { ...previous?.outcomes, ...outcomes },
      }
      await saveCloseout(closeout)
      await discardDraft(draft.dayKey)
      return { carried, carriedTo: nextDay, deleted, closeout }
    },
  )
}
