import { TriangleAlertIcon } from 'lucide-react'
import type { Task } from '@/types/task'
import { overlapWarningText } from '@/utils/overlapLabels'

interface OverlapWarningProps {
  id: string
  overlaps: Task[]
}

/** S3 warning under Duration (PRD AC25.3): informs, never blocks Save. Icon plus text, not color alone. */
export function OverlapWarning({ id, overlaps }: OverlapWarningProps) {
  if (!overlaps.length) return null
  return (
    <p id={id} className="flex items-start gap-2 rounded-md border bg-muted px-3 py-2 text-xs font-medium">
      <TriangleAlertIcon aria-hidden="true" className="mt-px size-3.5 shrink-0" />
      {overlapWarningText(overlaps)}
    </p>
  )
}
