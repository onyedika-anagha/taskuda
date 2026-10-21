import { render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createTask } from '@/services/db/taskRepository'
import { makeCompany, makeTask } from '@/test/factories'
import { renderWithApp } from '@/test/renderWithApp'
import { resetDatabase } from '@/test/resetDatabase'
import { setViewport } from '@/test/viewport'
import { addDaysToKey, todayKey } from '@/utils/dates'
import { AtRiskDialog } from './AtRiskDialog'
import { DayProgress } from './DayProgress'

const today = todayKey()
const yesterday = addDaysToKey(today, -1)

describe('DayProgress', () => {
  it.each([
    [4, 9, '4 of 9 done'],
    [0, 3, '0 of 3 done'],
    [9, 9, 'All 9 done'],
  ])('AC32.1 %i of %i reads "%s"', (done, total, text) => {
    render(<DayProgress done={done} total={total} />)
    expect(screen.getByText(text)).toBeInTheDocument()
  })
})

describe('AtRiskDialog (D9)', () => {
  const TODAY = '2026-10-21'

  it('lists each task with its marker, company and time, as a button', async () => {
    const onChoose = vi.fn<(task: unknown) => void>()
    const task = makeTask({ companyId: 'acme', startTime: '10:00', dayKey: TODAY })
    render(
      <AtRiskDialog
        open
        onOpenChange={() => {}}
        dayKey={TODAY}
        today={TODAY}
        atRisk={[{ task, kind: 'running_late' }]}
        companiesById={new Map([['acme', makeCompany()]])}
        onChoose={onChoose}
      />,
    )
    const dialog = screen.getByRole('dialog', { name: 'At risk today' })
    const row = within(dialog).getByRole('button', {
      name: 'Client call, running late, was due to start at 10:00 AM, Acme, 10:00 AM',
    })
    expect(within(row).getByText('Running late · 10:00 AM')).toBeInTheDocument()
    row.click()
    expect(onChoose).toHaveBeenCalledWith(task)
  })

  it('shows the empty state when nothing is at risk any more', () => {
    render(
      <AtRiskDialog
        open
        onOpenChange={() => {}}
        dayKey="2026-10-22"
        today={TODAY}
        atRisk={[]}
        companiesById={new Map()}
        onChoose={() => {}}
      />,
    )
    expect(screen.getByRole('dialog', { name: 'At risk on Thu, Oct 22' })).toBeInTheDocument()
    expect(screen.getByText('Nothing at risk right now.')).toBeInTheDocument()
  })
})

describe('Day summary row on Today (PRD FR32)', () => {
  beforeEach(async () => {
    await resetDatabase()
    setViewport('desktop')
  })

  it('AC32.1 progress updates as soon as a status changes', async () => {
    await createTask({ title: 'Standup', dayKey: today, block: 'morning' })
    await createTask({ title: 'Report', dayKey: today, block: 'morning' })
    const { user } = renderWithApp('/')
    expect(await screen.findByText('0 of 2 done')).toBeInTheDocument()
    const note = await screen.findByRole('article', { name: /^Standup/ })
    await user.click(within(note).getByRole('button', { name: /^Status: To Do/ }))
    await user.click(await within(note).findByRole('button', { name: /^Status: In Progress/ }))
    expect(await screen.findByText('1 of 2 done')).toBeInTheDocument()
  })

  it('DAC25 opens an at-risk task in 2 interactions', async () => {
    await createTask({ title: 'Send invoice', dayKey: today, block: 'morning', dueDate: yesterday })
    await createTask({ title: 'Fine', dayKey: today, block: 'morning' })
    const { user } = renderWithApp('/')
    await user.click(await screen.findByRole('button', { name: '1 task at risk. Show list' })) // 1
    const list = await screen.findByRole('dialog', { name: 'At risk today' })
    await user.click(within(list).getByRole('button', { name: /^Send invoice, overdue/ })) // 2
    const editor = await screen.findByRole('dialog', { name: 'Edit task' })
    expect(within(editor).getByLabelText('Title')).toHaveValue('Send invoice')
  })

  it('AC32.2 has no at-risk button when nothing is at risk, and no row on an empty day', async () => {
    renderWithApp('/')
    await screen.findByRole('region', { name: /^Morning/ })
    expect(screen.queryByText(/ done$/)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /at risk/ })).not.toBeInTheDocument()
  })
})
