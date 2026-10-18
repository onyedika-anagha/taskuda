interface MetricTileProps {
  label: string
  value: string
  explanation: string
}

export function MetricTile({ label, value, explanation }: MetricTileProps) {
  return (
    <div className="grid content-start gap-1 rounded-lg border bg-card p-4">
      <dt className="text-sm font-medium">{label}</dt>
      <dd className="text-3xl font-semibold tabular-nums">{value}</dd>
      <dd className="text-xs text-muted-foreground">{explanation}</dd>
    </div>
  )
}
