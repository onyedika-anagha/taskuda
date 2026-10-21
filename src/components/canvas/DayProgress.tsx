interface DayProgressProps {
  done: number
  total: number
}

/** "4 of 9 done" (PRD AC32.1, design Section 8). The bar is decorative; the text carries it. */
export function DayProgress({ done, total }: DayProgressProps) {
  const text = done === total ? `All ${total} done` : `${done} of ${total} done`

  return (
    <div className="flex min-w-0 items-center gap-3">
      <p className="text-sm text-muted-foreground tabular-nums">{text}</p>
      <div
        aria-hidden="true"
        className="hidden h-1 w-24 overflow-hidden rounded-full bg-foreground/10 min-[360px]:block"
      >
        <div className="h-full rounded-full bg-foreground/40" style={{ width: `${(done / total) * 100}%` }} />
      </div>
    </div>
  )
}
