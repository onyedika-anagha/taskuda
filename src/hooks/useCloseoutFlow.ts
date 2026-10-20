import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import type { FinishResult } from '@/services/closeout/closeoutService'
import { ValidationError } from '@/services/db/errors'
import { useCloseoutStore } from '@/stores/closeoutStore'
import { useRecommendationsStore } from '@/stores/recommendationsStore'
import type { CloseoutDraft, CloseoutStep } from '@/types/closeoutDraft'
import { CLOSEOUT_STEPS } from '@/types/closeoutDraft'
import type { Task } from '@/types/task'
import { relevantOutcomes, undecidedCount, unfinishedTasks } from '@/utils/closeoutRules'
import { relativeDayName } from '@/utils/dates'

function finishedMessage({ carried, carriedTo, closeout }: FinishResult): string {
  if (carried === 0) return 'Day closed.'
  const to = relativeDayName(closeout.dayKey, carriedTo)
  return `Day closed. ${carried} ${carried === 1 ? 'task' : 'tasks'} carried to ${to}.`
}

/** Step navigation and checks for an open closeout draft (design F5). */
export function useCloseoutFlow(draft: CloseoutDraft, tasks: Task[]) {
  const goTo = useCloseoutStore((s) => s.goTo)
  const finishCloseout = useCloseoutStore((s) => s.finish)
  const resetRecommendations = useRecommendationsStore((s) => s.reset)
  const [errorStep, setErrorStep] = useState<CloseoutStep | null>(null)
  const [finishing, setFinishing] = useState(false)

  const unfinished = useMemo(() => unfinishedTasks(tasks), [tasks])
  const outcomes = useMemo(() => relevantOutcomes(tasks, draft.outcomes), [tasks, draft.outcomes])
  const undecided = undecidedCount(tasks, draft.outcomes)
  const index = CLOSEOUT_STEPS.indexOf(draft.step)

  function blocked(step: CloseoutStep): boolean {
    if (step === 'unfinished') return undecided > 0
    if (step === 'reflect') return draft.rating === null
    return false
  }

  async function finish() {
    setFinishing(true)
    try {
      const result = await finishCloseout()
      toast.success(finishedMessage(result))
    } catch (error) {
      toast.error('Couldn’t close out the day.', {
        description: error instanceof ValidationError ? error.message : 'Your choices are kept. Try again.',
        action: { label: 'Try again', onClick: () => void finish() },
      })
    } finally {
      setFinishing(false)
    }
  }

  function next() {
    if (blocked(draft.step)) {
      setErrorStep(draft.step)
      return
    }
    setErrorStep(null)
    // A failed request is retried on the next visit to step 3.
    if (draft.step === 'recommendations') resetRecommendations()
    if (draft.step === 'report') void finish()
    else goTo(CLOSEOUT_STEPS[index + 1])
  }

  function back() {
    setErrorStep(null)
    if (draft.step === 'recommendations') resetRecommendations()
    if (index > 0) goTo(CLOSEOUT_STEPS[index - 1])
  }

  return {
    unfinished,
    outcomes,
    undecided,
    isFirstStep: index === 0,
    showError: errorStep === draft.step,
    finishing,
    next,
    back,
  }
}
