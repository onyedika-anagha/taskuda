import { useState } from 'react'
import { WeekdayPicker } from '@/components/common/WeekdayPicker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { useSetupWorkday } from '@/hooks/useSetupWorkday'
import { StepCard } from './StepCard'

/** Step 2: working days and the close-out reminder (PRD AC34.3, design F1.4). Skip keeps the defaults. */
export function WorkdayStep({ onDone }: { onDone: () => void }) {
  const workday = useSetupWorkday()
  const [error, setError] = useState(false)
  const { draft } = workday

  async function save() {
    try {
      await workday.save()
      onDone()
    } catch {
      setError(true)
    }
  }

  return (
    <StepCard
      title="Your workday"
      description="Taskuda carries tasks over, keeps your streak and reminds you on these days."
    >
      {draft === null ? (
        <Skeleton className="h-32 w-full" />
      ) : (
        <div className="grid gap-5">
          <div className="grid gap-1.5">
            <p className="text-sm font-medium" aria-hidden="true">
              Working days
            </p>
            <WeekdayPicker
              label="Working days"
              value={draft.workingDays}
              onChange={workday.setWorkingDays}
              minimumHint="Keep at least one working day."
            />
          </div>

          <div className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="setup-reminder-on">Close-out reminder</Label>
              <Switch
                id="setup-reminder-on"
                className="shrink-0"
                checked={draft.reminder !== null}
                onCheckedChange={workday.setReminderOn}
              />
            </div>
            {draft.reminder !== null ? (
              <div className="grid gap-1.5">
                <Label htmlFor="setup-reminder-time">Remind me to close out at</Label>
                <Input
                  id="setup-reminder-time"
                  type="time"
                  className="w-40"
                  defaultValue={draft.reminder}
                  onChange={(event) => workday.setReminderTime(event.target.value)}
                />
              </div>
            ) : null}
          </div>
        </div>
      )}

      {error ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          Couldn’t save your workday. Try again, or skip and change it later in Settings.
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
        <Button variant="outline" size="lg" onClick={onDone}>
          Skip
        </Button>
        <Button size="lg" disabled={draft === null} onClick={() => void save()}>
          Continue
        </Button>
      </div>
    </StepCard>
  )
}
