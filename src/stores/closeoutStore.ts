import { create } from 'zustand'
import * as service from '@/services/closeout/closeoutService'
import { getCloseout } from '@/services/db/closeoutRepository'
import type { Recommendation } from '@/types/ai'
import type { TaskOutcome } from '@/types/closeout'
import type { CloseoutDraft, CloseoutStep } from '@/types/closeoutDraft'
import type { Task } from '@/types/task'
import { carryOverAll } from '@/utils/closeoutRules'

type CloseoutView =
  | { mode: 'closed' }
  /** The day already has a closeout; offer "View report" or "Close out again". */
  | { mode: 'already-closed'; dayKey: string; finishedAt: number }
  | { mode: 'open'; draft: CloseoutDraft }

interface CloseoutState {
  view: CloseoutView
  /** Opens the closeout for a day, resuming a saved draft if there is one. */
  openCloseout: (dayKey: string) => Promise<void>
  /** "Close out again" from the already-closed state. */
  startAgain: (dayKey: string) => void
  close: () => void
  setOutcome: (taskId: string, outcome: TaskOutcome) => void
  carryOverAll: (tasks: Task[]) => void
  setRating: (rating: number) => void
  setReflection: (reflection: string) => void
  goTo: (step: CloseoutStep) => void
  markReportCopied: (at?: number) => void
  setRecommendations: (recommendations: Recommendation[]) => void
  finish: () => Promise<service.FinishResult>
}

export const useCloseoutStore = create<CloseoutState>((set, get) => {
  /** Updates the open draft and saves it right away. */
  function update(change: (draft: CloseoutDraft) => CloseoutDraft) {
    const { view } = get()
    if (view.mode !== 'open') return
    const draft = change(view.draft)
    set({ view: { mode: 'open', draft } })
    void service.saveDraft(draft)
  }

  return {
    view: { mode: 'closed' },

    openCloseout: async (dayKey) => {
      const [draft, existing] = await Promise.all([service.loadDraft(dayKey), getCloseout(dayKey)])
      if (draft) {
        set({ view: { mode: 'open', draft } })
      } else if (existing) {
        set({ view: { mode: 'already-closed', dayKey, finishedAt: existing.finishedAt } })
      } else {
        const fresh = service.newDraft(dayKey)
        set({ view: { mode: 'open', draft: fresh } })
        await service.saveDraft(fresh)
      }
    },

    startAgain: (dayKey) => {
      const fresh = service.newDraft(dayKey)
      set({ view: { mode: 'open', draft: fresh } })
      void service.saveDraft(fresh)
    },

    // The draft stays saved, so reopening resumes where the user left off.
    close: () => set({ view: { mode: 'closed' } }),

    setOutcome: (taskId, outcome) =>
      update((d) => ({ ...d, outcomes: { ...d.outcomes, [taskId]: outcome } })),
    carryOverAll: (tasks) => update((d) => ({ ...d, outcomes: carryOverAll(tasks, d.outcomes) })),
    setRating: (rating) => update((d) => ({ ...d, rating })),
    setReflection: (reflection) => update((d) => ({ ...d, reflection })),
    goTo: (step) => update((d) => ({ ...d, step })),
    markReportCopied: (at = Date.now()) => update((d) => ({ ...d, reportCopiedAt: d.reportCopiedAt ?? at })),
    setRecommendations: (recommendations) => update((d) => ({ ...d, recommendations })),

    finish: async () => {
      const { view } = get()
      if (view.mode !== 'open') throw new Error('No closeout is open')
      const result = await service.finishCloseout(view.draft)
      set({ view: { mode: 'closed' } })
      return result
    },
  }
})
