import { useCompanies } from '@/hooks/useCompanies'
import type { CompanyFormValues } from '@/schemas/companyForm'
import { createCompany, deleteCompany } from '@/services/db/companyRepository'
import { announce } from '@/stores/announcerStore'
import type { Company } from '@/types/company'
import { nextUnusedColorId } from '@/utils/companyPalette'

export const SETUP_COMPANY_NAME_ID = 'company-name'
export const removeCompanyButtonId = (id: string) => `setup-remove-${id}`

function focusById(id: string): void {
  document.getElementById(id)?.focus()
}

/** S1b step 1 (PRD AC34.2): add several companies, each with the next unused color, and remove them. */
export function useSetupCompanies() {
  const { companies } = useCompanies()
  const list = companies ?? []

  return {
    companies: list,
    loaded: companies !== undefined,
    /** Defaults for the next company. */
    nextValues(justAdded?: CompanyFormValues): CompanyFormValues {
      const used = list.map((c) => c.colorId).concat(justAdded ? [justAdded.colorId] : [])
      return { name: '', colorId: nextUnusedColorId(used) }
    },
    /** Rejects with `DuplicateCompanyNameError` so the form can show it inline. */
    async add(values: CompanyFormValues): Promise<void> {
      const company = await createCompany(values)
      announce(`${company.name} added`)
    },
    /** Focus moves to the next row's Remove, the previous one, or the name field (design Section 7). */
    async remove(company: Company): Promise<void> {
      const index = list.findIndex((c) => c.id === company.id)
      const neighbour = list[index + 1] ?? list[index - 1]
      await deleteCompany(company.id)
      announce(`${company.name} removed`)
      focusById(neighbour ? removeCompanyButtonId(neighbour.id) : SETUP_COMPANY_NAME_ID)
    },
  }
}
