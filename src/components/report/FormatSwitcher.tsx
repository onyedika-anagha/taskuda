import { cn } from '@/lib/utils'
import type { ReportFormat } from '@/types/report'
import { REPORT_FORMATS } from '@/types/report'
import { FORMAT_LABELS } from '@/utils/reportFormatters'

interface FormatSwitcherProps {
  value: ReportFormat
  onChange: (format: ReportFormat) => void
}

/** Segmented control built on native radios (arrow keys move between formats). */
export function FormatSwitcher({ value, onChange }: FormatSwitcherProps) {
  return (
    <fieldset className="grid gap-1.5">
      <legend className="mb-1.5 text-sm leading-none font-medium">Format</legend>
      <div className="inline-flex w-full rounded-lg bg-muted p-1 sm:w-auto">
        {REPORT_FORMATS.map((format) => (
          <label
            key={format}
            className={cn(
              'flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-md px-3 text-sm font-medium sm:flex-none',
              'has-focus-visible:ring-2 has-focus-visible:ring-ring',
              value === format ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground',
            )}
          >
            <input
              type="radio"
              name="report-format"
              value={format}
              checked={value === format}
              onChange={() => onChange(format)}
              className="sr-only"
            />
            {FORMAT_LABELS[format]}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
