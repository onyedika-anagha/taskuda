import { formatDuration } from '@/utils/taskPresentation'

const toDuration = (ms: number) => formatDuration(Math.round(ms / 60_000))

/** AC29.4 / AC29.5: always says the time is in Taskuda on this device, never total screen time (DAC21). */
export function TimeInTaskuda({ todayMs, averageMs }: { todayMs: number; averageMs: number }) {
  return (
    <p className="text-sm">
      Time in Taskuda today: <span className="font-medium tabular-nums">{toDuration(todayMs)}</span> · 7-day
      average: <span className="font-medium tabular-nums">{toDuration(averageMs)}</span>{' '}
      <span className="text-muted-foreground">(on this device, not total screen time)</span>
    </p>
  )
}
