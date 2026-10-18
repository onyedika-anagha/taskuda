import type { Ref } from 'react'
import { Label } from '@/components/ui/label'

interface ReportPreviewProps {
  text: string
  ref?: Ref<HTMLTextAreaElement>
}

/** Shows exactly what will be pasted. Read-only, but selectable for manual copy. */
export function ReportPreview({ text, ref }: ReportPreviewProps) {
  const rows = Math.min(18, Math.max(6, text.split('\n').length + 1))
  return (
    <div className="grid gap-1.5">
      <Label htmlFor="report-preview">Preview</Label>
      <textarea
        id="report-preview"
        ref={ref}
        readOnly
        value={text}
        rows={rows}
        className="w-full resize-y rounded-lg border bg-card p-3 font-mono text-sm leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
  )
}
