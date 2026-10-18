import { beforeEach, describe, expect, it } from 'vitest'
import { resetDatabase } from '@/test/resetDatabase'
import {
  countTasksForCompany,
  createCompany,
  deleteCompany,
  listCompanies,
  updateCompany,
} from './companyRepository'
import { DuplicateCompanyNameError, ValidationError } from './errors'
import { createTask, getTask } from './taskRepository'

describe('companyRepository', () => {
  beforeEach(resetDatabase)

  it('AC5.1 creates, renames and recolors a company', async () => {
    const acme = await createCompany({ name: ' Acme ', colorId: 'teal' })
    expect(acme).toMatchObject({ name: 'Acme', colorId: 'teal' })
    const renamed = await updateCompany(acme.id, { name: 'Acme Ltd', colorId: 'rose' })
    expect(renamed).toMatchObject({ name: 'Acme Ltd', colorId: 'rose' })
  })

  it('lists companies alphabetically', async () => {
    await createCompany({ name: 'Zeta', colorId: 'teal' })
    await createCompany({ name: 'Acme', colorId: 'sky' })
    expect((await listCompanies()).map((c) => c.name)).toEqual(['Acme', 'Zeta'])
  })

  it('rejects duplicate names regardless of case, with the design-spec copy', async () => {
    await createCompany({ name: 'Acme', colorId: 'teal' })
    await expect(createCompany({ name: 'acme', colorId: 'sky' })).rejects.toThrow(
      new DuplicateCompanyNameError('Acme'),
    )
    expect(new DuplicateCompanyNameError('Acme').message).toBe('You already have a company called Acme.')
  })

  it('allows keeping the same name when renaming', async () => {
    const acme = await createCompany({ name: 'Acme', colorId: 'teal' })
    await expect(updateCompany(acme.id, { name: 'ACME' })).resolves.toMatchObject({ name: 'ACME' })
  })

  it('rejects empty names and unknown colors', async () => {
    await expect(createCompany({ name: ' ', colorId: 'teal' })).rejects.toThrow(ValidationError)
    await expect(createCompany({ name: 'Acme', colorId: 'chartreuse' })).rejects.toThrow(ValidationError)
  })

  it('AC5.3 deleting a company keeps its tasks and removes the tag', async () => {
    const acme = await createCompany({ name: 'Acme', colorId: 'teal' })
    const task = await createTask({ title: 'A', dayKey: '2026-10-19', block: 'morning', companyId: acme.id })
    expect(await countTasksForCompany(acme.id)).toBe(1)
    await deleteCompany(acme.id)
    expect(await listCompanies()).toEqual([])
    expect((await getTask(task.id))?.companyId).toBeNull()
  })
})
