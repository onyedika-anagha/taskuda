import { CircleAlertIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AtRiskButtonProps {
  count: number
  onClick: () => void
}

/**
 * "At risk · 2" (PRD AC32.2). Hidden at 0; count changes aren't announced (AC32.4). The spoken name
 * starts with the visible text (WCAG 2.5.3): "At risk · 2, show 2 tasks".
 */
export function AtRiskButton({ count, onClick }: AtRiskButtonProps) {
  if (count === 0) return null
  const name = `At risk · ${count}, show ${count} ${count === 1 ? 'task' : 'tasks'}`

  return (
    <Button type="button" variant="outline" className="min-h-11 shrink-0" aria-label={name} onClick={onClick}>
      <CircleAlertIcon aria-hidden="true" />
      <span className="tabular-nums">At risk · {count}</span>
    </Button>
  )
}
