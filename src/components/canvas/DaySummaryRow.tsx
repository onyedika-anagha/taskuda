import { useState } from 'react'
import type { TaskRisks } from '@/hooks/useTaskRisks'
import { useCanvasUiStore } from '@/stores/canvasUiStore'
import type { Company } from '@/types/company'
import { AtRiskButton } from './AtRiskButton'
import { AtRiskDialog } from './AtRiskDialog'
import { DayProgress } from './DayProgress'

interface DaySummaryRowProps {
  dayKey: string
  risks: TaskRisks
  companiesById: Map<string, Company>
}

/** S2 day summary row (PRD FR32): progress, and the at-risk button that opens D9. */
export function DaySummaryRow({ dayKey, risks, companiesById }: DaySummaryRowProps) {
  const [listOpen, setListOpen] = useState(false)
  const openEdit = useCanvasUiStore((s) => s.openEdit)
  if (risks.total === 0) return null

  return (
    <div className="flex min-h-11 items-center justify-between gap-3">
      <DayProgress done={risks.done} total={risks.total} />
      <AtRiskButton count={risks.atRisk.length} onClick={() => setListOpen(true)} />
      <AtRiskDialog
        open={listOpen}
        onOpenChange={setListOpen}
        dayKey={dayKey}
        today={risks.today}
        atRisk={risks.atRisk}
        companiesById={companiesById}
        onChoose={(task) => {
          setListOpen(false)
          openEdit(task.id)
        }}
      />
    </div>
  )
}
