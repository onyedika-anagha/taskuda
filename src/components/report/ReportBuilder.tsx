import { CheckIcon, CopyIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCopyReport } from '@/hooks/useCopyReport'
import type { TaskOutcome } from '@/types/closeout'
import type { Company } from '@/types/company'
import type { ReportFormat, ReportScope } from '@/types/report'
import type { Task } from '@/types/task'
import { buildReport, isReportEmpty } from '@/utils/reportBuilder'
import { formatReport } from '@/utils/reportFormatters'
import { FormatSwitcher } from './FormatSwitcher'
import { ReportPreview } from './ReportPreview'

interface ReportBuilderProps {
  dayKey: string
  tasks: Task[]
  companies: Company[]
  pendingOutcomes?: Record<string, TaskOutcome>
  onCopied: (at: number) => void
}

/** Scope, format, preview and one-click copy (PRD FR14). Shared by closeout step 4 and S6. */
export function ReportBuilder({ dayKey, tasks, companies, pendingOutcomes, onCopied }: ReportBuilderProps) {
  const [scope, setScope] = useState<ReportScope>('all')
  const [format, setFormat] = useState<ReportFormat>('slack')
  const { state, copy, previewRef, reset } = useCopyReport(onCopied)

  const report = useMemo(
    () => buildReport({ dayKey, tasks, companies, scope, pendingOutcomes }),
    [dayKey, tasks, companies, scope, pendingOutcomes],
  )
  const text = useMemo(() => formatReport(report, format), [report, format])
  const empty = isReportEmpty(report)

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        {companies.length > 0 ? (
          <div className="grid gap-1.5 sm:w-56">
            <Label htmlFor="report-scope">Companies</Label>
            <Select
              value={scope}
              onValueChange={(value) => {
                setScope(value)
                reset()
              }}
            >
              <SelectTrigger id="report-scope" className="min-h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All companies</SelectItem>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
        <FormatSwitcher
          value={format}
          onChange={(next) => {
            setFormat(next)
            reset()
          }}
        />
      </div>

      {empty ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          Nothing to report yet. Mark tasks done and they’ll show up here.
        </p>
      ) : (
        <ReportPreview ref={previewRef} text={text} />
      )}

      {state === 'failed' ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          Couldn’t copy automatically. The text is selected — press Ctrl+C (⌘C on Mac) to copy it.
        </p>
      ) : null}

      <Button
        size="lg"
        className="min-h-11 justify-self-start"
        disabled={empty}
        onClick={() => void copy(text)}
      >
        {state === 'copied' ? <CheckIcon aria-hidden="true" /> : <CopyIcon aria-hidden="true" />}
        {state === 'copied' ? 'Copied' : 'Copy report'}
      </Button>
    </div>
  )
}
