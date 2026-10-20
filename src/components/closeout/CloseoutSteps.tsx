import { ReportBuilder } from '@/components/report/ReportBuilder'
import { useCloseoutFlow } from '@/hooks/useCloseoutFlow'
import { useRecommendationsStep } from '@/hooks/useRecommendationsStep'
import { useCloseoutStore } from '@/stores/closeoutStore'
import type { CloseoutDraft } from '@/types/closeoutDraft'
import type { Company } from '@/types/company'
import type { Task } from '@/types/task'
import { Button } from '@/components/ui/button'
import { CloseoutStepper } from './CloseoutStepper'
import { RecommendationsStep } from './RecommendationsStep'
import { ReflectStep } from './ReflectStep'
import { UnfinishedStep } from './UnfinishedStep'

interface CloseoutStepsProps {
  draft: CloseoutDraft
  tasks: Task[]
  companies: Company[]
  companiesById: Map<string, Company>
}

const NEXT_LABELS = { unfinished: 'Next', reflect: 'Next', report: 'Finish day' } as const

/** The four closeout steps and their Back / Next footer. */
export function CloseoutSteps({ draft, tasks, companies, companiesById }: CloseoutStepsProps) {
  const flow = useCloseoutFlow(draft, tasks)
  const recommendations = useRecommendationsStep(draft, tasks, companiesById)
  const setOutcome = useCloseoutStore((s) => s.setOutcome)
  const carryOverAll = useCloseoutStore((s) => s.carryOverAll)
  const setRating = useCloseoutStore((s) => s.setRating)
  const setReflection = useCloseoutStore((s) => s.setReflection)
  const markReportCopied = useCloseoutStore((s) => s.markReportCopied)

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      <CloseoutStepper step={draft.step} />

      {/* Scrolls on its own so tall steps never slide under the Back / Next footer. */}
      <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1 pb-1">
        {draft.step === 'unfinished' ? (
          <UnfinishedStep
            tasks={flow.unfinished}
            companiesById={companiesById}
            outcomes={flow.outcomes}
            undecided={flow.undecided}
            showError={flow.showError}
            onOutcome={setOutcome}
            onCarryAll={() => carryOverAll(tasks)}
          />
        ) : null}
        {draft.step === 'reflect' ? (
          <ReflectStep
            rating={draft.rating}
            reflection={draft.reflection}
            showError={flow.showError}
            onRating={setRating}
            onReflection={setReflection}
          />
        ) : null}
        {draft.step === 'recommendations' ? (
          <RecommendationsStep
            view={recommendations.view}
            onSend={() => void recommendations.send()}
            onRetry={recommendations.retry}
            onUnlock={() => void recommendations.unlockAndRetry()}
          />
        ) : null}
        {draft.step === 'report' ? (
          <div className="grid gap-3">
            <h3 className="font-semibold">Your report</h3>
            <ReportBuilder
              dayKey={draft.dayKey}
              tasks={tasks}
              companies={companies}
              pendingOutcomes={flow.outcomes}
              onCopied={markReportCopied}
            />
          </div>
        ) : null}
      </div>

      <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
        {!flow.isFirstStep ? (
          <Button variant="outline" size="lg" onClick={flow.back}>
            Back
          </Button>
        ) : null}
        <Button size="lg" onClick={flow.next} disabled={flow.finishing}>
          {flow.finishing
            ? 'Closing out…'
            : draft.step === 'recommendations'
              ? recommendations.view.state === 'results'
                ? 'Next'
                : 'Skip'
              : NEXT_LABELS[draft.step]}
        </Button>
      </div>
    </div>
  )
}
