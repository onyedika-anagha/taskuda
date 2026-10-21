import {
  CalendarClockIcon,
  CircleAlertIcon,
  ClockIcon,
  RepeatIcon,
  TimerOffIcon,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RiskKind } from '@/types/risk'
import { riskMarkerVariables } from '@/utils/riskMarkerColors'
import { RISK_STRENGTH } from '@/utils/riskLabels'

const RISK_ICONS: Record<RiskKind, LucideIcon> = {
  overdue: CircleAlertIcon,
  overran: TimerOffIcon,
  running_late: ClockIcon,
  due_today: CalendarClockIcon,
  stuck: RepeatIcon,
}

interface RiskMarkerProps {
  kind: RiskKind
  label: string
  className?: string
}

/**
 * One at-risk marker (PRD FR31, design Section 10): icon and text, never color alone. Not a live
 * region, so markers changing as time passes are never announced.
 */
export function RiskMarker({ kind, label, className }: RiskMarkerProps) {
  const Icon = RISK_ICONS[kind]
  const strong = RISK_STRENGTH[kind] === 'strong'

  return (
    <span
      data-risk={kind}
      style={riskMarkerVariables()}
      className={cn(
        'inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-xs shadow-xs',
        'bg-(--risk-bg) dark:bg-(--risk-bg-dark)',
        strong
          ? 'font-semibold text-(--risk-strong) dark:text-(--risk-strong-dark)'
          : 'font-medium text-(--risk-text) dark:text-(--risk-text-dark)',
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-3.5 shrink-0" />
      <span className="min-w-0">{label}</span>
    </span>
  )
}
