import { useLiveQuery } from 'dexie-react-hooks'
import { countTasksForCompany } from '@/services/db/companyRepository'

/** Number of tasks tagged with a company; `undefined` while loading or when no company is given. */
export function useCompanyTaskCount(companyId: string | undefined): number | undefined {
  return useLiveQuery(() => (companyId ? countTasksForCompany(companyId) : undefined), [companyId])
}
