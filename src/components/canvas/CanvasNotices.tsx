import { HistoryIcon, LightbulbIcon, TriangleAlertIcon } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { formatDayShort } from '@/utils/taskPresentation'

/** Storage blocked (design S2 error state); editing is disabled while this shows. */
export function StorageErrorNotice() {
  return (
    <Alert variant="destructive">
      <TriangleAlertIcon aria-hidden="true" />
      <AlertTitle>Taskuda can’t save on this device.</AlertTitle>
      <AlertDescription>
        Your browser is blocking storage, often because of private browsing. Open Taskuda in a normal window
        to keep your tasks.
      </AlertDescription>
    </Alert>
  )
}

export function PastDayNotice({ dayKey }: { dayKey: string }) {
  return (
    <Alert>
      <HistoryIcon aria-hidden="true" />
      <AlertDescription>
        You’re viewing {formatDayShort(dayKey)}. Tasks from past days can’t be edited.
      </AlertDescription>
    </Alert>
  )
}

/** Shown when the day is empty and no companies exist yet. */
export function CompanyTip() {
  return (
    <p className="flex items-center gap-2 text-sm text-muted-foreground">
      <LightbulbIcon aria-hidden="true" className="size-4 shrink-0" />
      Tip: add companies in Settings to color-code your tasks.
    </p>
  )
}
