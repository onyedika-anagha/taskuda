import { useMemo } from 'react'
import { toast } from 'sonner'
import * as companies from '@/services/db/companyRepository'
import type { Company, CompanyInput } from '@/types/company'

export interface CompanyActions {
  /** Rejects with `DuplicateCompanyNameError` or `ValidationError` so the form can show it inline. */
  saveCompany: (input: CompanyInput, existing?: Company) => Promise<void>
  countTasks: (company: Company) => Promise<number>
  deleteCompany: (company: Company) => Promise<void>
}

export function useCompanyActions(): CompanyActions {
  return useMemo(
    () => ({
      async saveCompany(input, existing) {
        if (existing) await companies.updateCompany(existing.id, input)
        else await companies.createCompany(input)
        toast.success('Company saved')
      },
      countTasks: (company) => companies.countTasksForCompany(company.id),
      async deleteCompany(company) {
        try {
          await companies.deleteCompany(company.id)
          toast.success('Company deleted')
        } catch {
          toast.error('Couldn’t delete the company.', {
            action: { label: 'Try again', onClick: () => void companies.deleteCompany(company.id) },
          })
        }
      },
    }),
    [],
  )
}
