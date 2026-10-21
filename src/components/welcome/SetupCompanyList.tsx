import { XIcon } from 'lucide-react'
import { CompanyChip } from '@/components/company/CompanyChip'
import { Button } from '@/components/ui/button'
import { removeCompanyButtonId } from '@/hooks/useSetupCompanies'
import type { Company } from '@/types/company'

interface SetupCompanyListProps {
  companies: Company[]
  onRemove: (company: Company) => void
}

/** Companies added so far in setup (design S1b), each with Remove. Scrolls past 5 companies. */
export function SetupCompanyList({ companies, onRemove }: SetupCompanyListProps) {
  if (companies.length === 0) return null

  return (
    <ul aria-label="Companies added" className="grid max-h-72 gap-2 overflow-y-auto">
      {companies.map((company) => (
        <li key={company.id} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-1">
          <CompanyChip company={company} />
          <Button
            id={removeCompanyButtonId(company.id)}
            type="button"
            variant="ghost"
            size="icon"
            className="size-11"
            aria-label={`Remove ${company.name}`}
            onClick={() => onRemove(company)}
          >
            <XIcon aria-hidden="true" />
          </Button>
        </li>
      ))}
    </ul>
  )
}
