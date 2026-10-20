import { toast } from 'sonner'
import { WeekdayPicker } from '@/components/common/WeekdayPicker'
import { Skeleton } from '@/components/ui/skeleton'
import { useWorkingDays } from '@/hooks/useWorkingDays'
import { setWorkingDays } from '@/services/workday/workdaySettings'
import type { Weekday } from '@/types/workday'

/** Same id for every change, so quick edits merge into one "Saved" toast (design S7h). */
const SAVED_TOAST_ID = 'workday-saved'

async function saveWorkingDays(days: Weekday[]): Promise<void> {
  try {
    await setWorkingDays(days)
    toast.success('Saved', { id: SAVED_TOAST_ID })
  } catch {
    toast.error('Couldn’t save your working days.', {
      action: { label: 'Try again', onClick: () => void saveWorkingDays(days) },
    })
  }
}

/** S7h Workday (PRD FR19; FR21, FR23, FR28 and FR29 add their settings here). */
export function WorkdaySection() {
  const workingDays = useWorkingDays()

  return (
    <section aria-labelledby="workday-heading" className="grid gap-4">
      <h2 id="workday-heading" className="text-lg font-semibold">
        Workday
      </h2>
      {!workingDays ? (
        <Skeleton className="h-32 w-full" />
      ) : (
        <div className="grid gap-5 rounded-lg border bg-card p-4">
          <div className="grid gap-2">
            <div className="grid gap-1">
              <h3 className="font-medium">Working days</h3>
              <p className="text-sm text-muted-foreground">
                Taskuda carries tasks over, keeps your streak and sends reminders on these days.
              </p>
            </div>
            <WeekdayPicker
              label="Working days"
              value={workingDays}
              onChange={(days) => void saveWorkingDays(days)}
              minimumHint="Keep at least one working day."
            />
          </div>
        </div>
      )}
    </section>
  )
}
