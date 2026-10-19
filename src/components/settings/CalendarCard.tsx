import { formatDistanceToNowStrict } from 'date-fns'
import { useState } from 'react'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useCalendarConnection } from '@/hooks/useCalendarConnection'
import { useNow } from '@/hooks/useNow'
import { useCalendarStore } from '@/stores/calendarStore'

function lastSyncText(lastSyncAt: number | null, now: number): string {
  if (!lastSyncAt) return 'Not synced yet'
  if (now - lastSyncAt < 60_000) return 'Synced just now'
  return `Synced ${formatDistanceToNowStrict(lastSyncAt, { roundingMethod: 'floor' })} ago`
}

/** S7b Google Calendar card (PRD FR8, design F9). */
export function CalendarCard() {
  const status = useCalendarStore((s) => s.status)
  const calendarId = useCalendarStore((s) => s.calendarId)
  const calendarName = useCalendarStore((s) => s.calendarName)
  const calendars = useCalendarStore((s) => s.calendars)
  const calendar = useCalendarConnection()
  const now = useNow()
  const [confirmOff, setConfirmOff] = useState(false)

  return (
    <section aria-labelledby="calendar-heading" className="grid gap-3 rounded-lg border bg-card p-4">
      <h3 id="calendar-heading" className="font-semibold">
        Google Calendar
      </h3>
      <p className="text-sm text-muted-foreground">
        Show tasks with a start time in Google Calendar, and calendar events as tasks. Syncs while Taskuda is
        open.
      </p>

      {status.state === 'loading' ? <Skeleton className="h-11 w-full" /> : null}

      {calendar.error ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {calendar.error}
        </p>
      ) : null}

      {status.state === 'off' ? (
        <Button
          className="min-h-11 justify-self-start"
          disabled={calendar.busy}
          onClick={() => void calendar.connect()}
        >
          {calendar.busy ? 'Connecting…' : 'Connect'}
        </Button>
      ) : null}

      {status.state !== 'off' && status.state !== 'loading' ? (
        <>
          <div className="grid gap-1.5">
            <Label htmlFor="calendar-choice">Sync with</Label>
            {calendars.length > 0 ? (
              <Select
                value={calendarId ?? undefined}
                onValueChange={(id) => {
                  const chosen = calendars.find((c) => c.id === id)
                  if (chosen) void calendar.chooseCalendar(chosen)
                }}
              >
                <SelectTrigger id="calendar-choice" className="min-h-11 w-full sm:w-72">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {calendars.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.summary}
                      {c.primary ? ' (main calendar)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <p id="calendar-choice" className="text-sm font-medium">
                  {calendarName ?? 'Your calendar'}
                </p>
                <Button variant="ghost" className="min-h-11" onClick={() => void calendar.loadCalendars()}>
                  Change calendar
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Switching calendars starts fresh; events already added stay where they are.
            </p>
          </div>

          <p className="text-sm" aria-live="polite">
            {status.state === 'syncing'
              ? 'Syncing…'
              : status.state === 'paused'
                ? `Calendar sync paused: ${status.reason}.`
                : status.state === 'reconnect'
                  ? 'Your Google session expired.'
                  : lastSyncText(status.lastSyncAt, now)}
          </p>

          <div className="flex flex-wrap gap-2">
            <Button
              className="min-h-11"
              disabled={status.state === 'syncing' || calendar.busy}
              onClick={() => void calendar.syncNow()}
            >
              {status.state === 'reconnect'
                ? 'Reconnect Google'
                : status.state === 'paused'
                  ? 'Try again'
                  : 'Sync now'}
            </Button>
            <Button variant="ghost" className="min-h-11" onClick={() => setConfirmOff(true)}>
              Turn off sync
            </Button>
          </div>
        </>
      ) : null}

      <ConfirmDialog
        open={confirmOff}
        title="Turn off calendar sync?"
        description="Taskuda stops syncing. Your tasks and calendar events stay as they are; nothing is deleted."
        confirmLabel="Turn off sync"
        onCancel={() => setConfirmOff(false)}
        onConfirm={() => {
          setConfirmOff(false)
          void calendar.turnOff()
        }}
      />
    </section>
  )
}
