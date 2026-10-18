import { screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { createCompany, listCompanies } from '@/services/db/companyRepository'
import { createTask, getTask } from '@/services/db/taskRepository'
import { renderWithApp } from '@/test/renderWithApp'
import { resetDatabase } from '@/test/resetDatabase'

describe('Companies settings (S7a)', () => {
  beforeEach(resetDatabase)

  it('shows the empty state', async () => {
    renderWithApp('/settings/companies')
    expect(await screen.findByText('No companies yet. Add one to color-code your tasks.')).toBeInTheDocument()
  })

  it('AC5.1 adds a company with a name and color', async () => {
    const { user } = renderWithApp('/settings/companies')
    await user.click(await screen.findByRole('button', { name: 'Add company' }))
    const dialog = await screen.findByRole('dialog', { name: 'Add company' })
    await user.type(within(dialog).getByLabelText('Name'), 'Acme')
    await user.click(within(dialog).getByRole('radio', { name: 'Rose' }))
    await user.click(within(dialog).getByRole('button', { name: 'Save' }))

    await waitFor(async () =>
      expect(await listCompanies()).toMatchObject([{ name: 'Acme', colorId: 'rose' }]),
    )
    expect(await screen.findByRole('button', { name: 'Edit Acme' })).toBeInTheDocument()
  })

  it('shows the duplicate-name error inline', async () => {
    await createCompany({ name: 'Acme', colorId: 'teal' })
    const { user } = renderWithApp('/settings/companies')
    await user.click(await screen.findByRole('button', { name: 'Add company' }))
    const dialog = await screen.findByRole('dialog', { name: 'Add company' })
    await user.type(within(dialog).getByLabelText('Name'), 'acme')
    await user.click(within(dialog).getByRole('button', { name: 'Save' }))
    expect(await within(dialog).findByText('You already have a company called Acme.')).toBeInTheDocument()
  })

  it('AC5.1 renames a company', async () => {
    await createCompany({ name: 'Acme', colorId: 'teal' })
    const { user } = renderWithApp('/settings/companies')
    await user.click(await screen.findByRole('button', { name: 'Edit Acme' }))
    const dialog = await screen.findByRole('dialog', { name: 'Edit company' })
    const name = within(dialog).getByLabelText('Name')
    await user.clear(name)
    await user.type(name, 'Acme Ltd')
    await user.click(within(dialog).getByRole('button', { name: 'Save' }))
    expect(await screen.findByRole('button', { name: 'Edit Acme Ltd' })).toBeInTheDocument()
  })

  it('AC5.3 asks before deleting a company with tasks and keeps the tasks', async () => {
    const acme = await createCompany({ name: 'Acme', colorId: 'teal' })
    const task = await createTask({ title: 'A', dayKey: '2026-10-19', block: 'morning', companyId: acme.id })
    const { user } = renderWithApp('/settings/companies')
    await user.click(await screen.findByRole('button', { name: 'Delete Acme' }))

    const dialog = await screen.findByRole('alertdialog', { name: 'Delete Acme?' })
    expect(dialog).toHaveTextContent(
      '1 task is tagged with Acme. They’ll keep their content but lose the company tag.',
    )
    await user.click(within(dialog).getByRole('button', { name: 'Delete company' }))

    await waitFor(async () => expect(await listCompanies()).toEqual([]))
    expect((await getTask(task.id))?.companyId).toBeNull()
  })
})
