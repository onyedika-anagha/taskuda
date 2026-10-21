import type { ReactNode } from 'react'

interface MetricTileProps {
  label: string
  value: string
  explanation: string
  /** E.g. a link to turn the feature on when the metric is off. */
  action?: ReactNode
}

export function MetricTile({ label, value, explanation, action }: MetricTileProps) {
  return (
    <div className="grid content-start gap-1 rounded-lg border bg-card p-4">
      <dt className="text-sm font-medium">{label}</dt>
      <dd className="text-3xl font-semibold tabular-nums">{value}</dd>
      <dd className="text-xs text-muted-foreground">{explanation}</dd>
      {action ? <dd className="text-xs">{action}</dd> : null}
    </div>
  )
}
