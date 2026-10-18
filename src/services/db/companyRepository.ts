import type { Company, CompanyInput } from '@/types/company'
import { isPaletteColorId } from '@/utils/companyPalette'
import { db } from './database'
import { DuplicateCompanyNameError, RecordNotFoundError, ValidationError } from './errors'

export const COMPANY_NAME_MAX_LENGTH = 60

function cleanName(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) throw new ValidationError('Give the company a name.')
  if (trimmed.length > COMPANY_NAME_MAX_LENGTH) {
    throw new ValidationError(`Keep the name under ${COMPANY_NAME_MAX_LENGTH} characters.`)
  }
  return trimmed
}

function checkColor(colorId: string): void {
  if (!isPaletteColorId(colorId)) throw new ValidationError('Pick one of the colors.')
}

async function ensureUniqueName(name: string, exceptId?: string): Promise<void> {
  const lower = name.toLocaleLowerCase()
  const clash = await db.companies
    .filter((c) => c.id !== exceptId && c.name.toLocaleLowerCase() === lower)
    .first()
  if (clash) throw new DuplicateCompanyNameError(clash.name)
}

export async function listCompanies(): Promise<Company[]> {
  const companies = await db.companies.toArray()
  return companies.sort((a, b) => a.name.localeCompare(b.name))
}

export function getCompany(id: string): Promise<Company | undefined> {
  return db.companies.get(id)
}

export async function createCompany(input: CompanyInput): Promise<Company> {
  const name = cleanName(input.name)
  checkColor(input.colorId)
  return db.transaction('rw', db.companies, async () => {
    await ensureUniqueName(name)
    const now = Date.now()
    const company: Company = {
      id: crypto.randomUUID(),
      name,
      colorId: input.colorId,
      createdAt: now,
      updatedAt: now,
    }
    await db.companies.add(company)
    return company
  })
}

export async function updateCompany(id: string, input: Partial<CompanyInput>): Promise<Company> {
  const name = input.name !== undefined ? cleanName(input.name) : undefined
  if (input.colorId !== undefined) checkColor(input.colorId)
  return db.transaction('rw', db.companies, async () => {
    const company = await db.companies.get(id)
    if (!company) throw new RecordNotFoundError('Company', id)
    if (name !== undefined) await ensureUniqueName(name, id)
    const updated: Company = {
      ...company,
      ...(name !== undefined ? { name } : {}),
      ...(input.colorId !== undefined ? { colorId: input.colorId } : {}),
      updatedAt: Date.now(),
    }
    await db.companies.put(updated)
    return updated
  })
}

export function countTasksForCompany(id: string): Promise<number> {
  return db.tasks.where('companyId').equals(id).count()
}

/** Deletes the company and removes its tag from every task; the tasks themselves are kept (design D3). */
export async function deleteCompany(id: string): Promise<void> {
  await db.transaction('rw', db.companies, db.tasks, async () => {
    const now = Date.now()
    await db.tasks.where('companyId').equals(id).modify({ companyId: null, updatedAt: now })
    await db.companies.delete(id)
  })
}
