import { cn } from '@/lib/utils'
import type { CloseoutStep } from '@/types/closeoutDraft'
import { CLOSEOUT_STEPS } from '@/types/closeoutDraft'
import { STEP_LABELS } from '@/utils/closeoutRules'

/** "Step 2 of 4" plus the step names; the current step is marked for screen readers. */
export function CloseoutStepper({ step }: { step: CloseoutStep }) {
  const index = CLOSEOUT_STEPS.indexOf(step)
  return (
    <div className="grid gap-2">
      <p className="text-xs font-medium text-muted-foreground" aria-live="polite">
        Step {index + 1} of {CLOSEOUT_STEPS.length}: {STEP_LABELS[step]}
      </p>
      <ol className="grid grid-cols-4 gap-1" aria-hidden="true">
        {CLOSEOUT_STEPS.map((s, i) => (
          <li key={s} className="grid gap-1">
            <span className={cn('h-1 rounded-full', i <= index ? 'bg-foreground' : 'bg-muted')} />
            <span
              className={cn(
                'hidden text-xs sm:block',
                i === index ? 'font-semibold' : 'text-muted-foreground',
              )}
            >
              {STEP_LABELS[s]}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}
