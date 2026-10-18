import { cn } from '@/lib/utils'
import type { Company } from '@/types/company'
import { noteColorVariables } from '@/utils/noteColors'

interface CompanyChipProps {
  company: Company
  className?: string
}

/** Color swatch plus name, so the company never relies on color alone (design spec Section 7). */
export function CompanyChip({ company, className }: CompanyChipProps) {
  return (
    <span
      className={cn('inline-flex min-w-0 items-center gap-1.5 text-xs font-medium', className)}
      style={noteColorVariables(company.colorId)}
    >
      <span
        aria-hidden="true"
        className="size-2.5 shrink-0 rounded-full bg-(--note-edge) dark:bg-(--note-edge-dark)"
      />
      <span className="truncate">{company.name}</span>
    </span>
  )
}
