import { toast } from 'sonner'
import { TimeRangeField } from '@/components/common/TimeRangeField'
import { WeekdayPicker } from '@/components/common/WeekdayPicker'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { useWorkdaySettings } from '@/hooks/useWorkdaySettings'
import {
  setCloseoutReminder,
  setQuietHours,
  setWorkingDays,
} from '@/services/workday/workdaySettings'
import { DEFAULT_CLOSEOUT_REMINDER } from '@/types/workday'
import { isValidTime } from '@/utils/timeBlocks'

/** Same id for every change, so quick edits merge into one "Saved" toast (design S7h). */
const SAVED_TOAST_ID = 'workday-saved'

async function save(write: () => Promise<void>): Promise<void> {
  try {
    await write()
    toast.success('Saved', { id: SAVED_TOAST_ID })
  } catch {
    toast.error('Couldn’t save this setting.', {
      action: { label: 'Try again', onClick: () => void save(write) },
    })
  }
}

function SettingHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="grid gap-1">
      <h3 className="font-medium">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

/** S7h Workday (PRD FR19, FR21, FR23; FR28 and FR29 add their settings here). */
export function WorkdaySection() {
  const settings = useWorkdaySettings()

  return (
    <section aria-labelledby="workday-heading" className="grid gap-4">
      <h2 id="workday-heading" className="text-lg font-semibold">
        Workday
      </h2>
      {!settings ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="grid gap-6 rounded-lg border bg-card p-4">
          <div className="grid gap-2">
            <SettingHeading
              title="Working days"
              description="Taskuda carries tasks over, keeps your streak and sends reminders on these days."
            />
            <WeekdayPicker
              label="Working days"
              value={settings.workingDays}
              onChange={(days) => void save(() => setWorkingDays(days))}
              minimumHint="Keep at least one working day."
            />
          </div>

          <div className="grid gap-3">
            <div className="flex items-start justify-between gap-4">
              <Label htmlFor="closeout-reminder-on" className="grid gap-1 font-normal">
                <span className="font-medium">Close-out reminder</span>
                <span className="text-sm text-muted-foreground">
                  On working days, if you haven’t closed out yet.
                </span>
              </Label>
              <Switch
                id="closeout-reminder-on"
                checked={settings.closeoutReminder !== null}
                onCheckedChange={(on) =>
                  void save(() => setCloseoutReminder(on ? DEFAULT_CLOSEOUT_REMINDER : null))
                }
              />
            </div>
            {settings.closeoutReminder !== null ? (
              <div className="grid gap-1.5">
                <Label htmlFor="closeout-reminder-time">Remind me to close out at</Label>
                <Input
                  id="closeout-reminder-time"
                  type="time"
                  className="min-h-11 w-full min-[400px]:w-36"
                  defaultValue={settings.closeoutReminder}
                  onChange={(event) => {
                    const time = event.target.value
                    if (isValidTime(time)) void save(() => setCloseoutReminder(time))
                  }}
                />
              </div>
            ) : null}
          </div>

          <div className="grid gap-3">
            <div className="flex items-start justify-between gap-4">
              <Label htmlFor="quiet-hours-on" className="grid gap-1 font-normal">
                <span className="font-medium">Quiet hours</span>
                <span className="text-sm text-muted-foreground">
                  No spoken alerts or eye-break prompts during these hours. Reminders still show on screen.
                </span>
              </Label>
              <Switch
                id="quiet-hours-on"
                checked={settings.quietHours.enabled}
                onCheckedChange={(enabled) =>
                  void save(() => setQuietHours({ ...settings.quietHours, enabled }))
                }
              />
            </div>
            {settings.quietHours.enabled ? (
              <TimeRangeField
                legend="Quiet hours"
                value={settings.quietHours}
                onChange={(range) => void save(() => setQuietHours({ ...settings.quietHours, ...range }))}
              />
            ) : null}
          </div>
        </div>
      )}
    </section>
  )
}
