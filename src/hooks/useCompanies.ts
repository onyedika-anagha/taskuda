import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo } from 'react'
import { listCompanies } from '@/services/db/companyRepository'
import type { Company } from '@/types/company'

interface CompaniesResult {
  /** `undefined` while loading. */
  companies: Company[] | undefined
  byId: Map<string, Company>
}

export function useCompanies(): CompaniesResult {
  const companies = useLiveQuery(() => listCompanies(), [])
  const byId = useMemo(() => new Map((companies ?? []).map((c) => [c.id, c])), [companies])
  return { companies, byId }
}
