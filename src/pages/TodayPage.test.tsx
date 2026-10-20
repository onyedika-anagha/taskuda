import { screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { createCompany } from '@/services/db/companyRepository'
import { createTask, getTask, listTasksForDay } from '@/services/db/taskRepository'
import { renderWithApp } from '@/test/renderWithApp'
import { resetDatabase } from '@/test/resetDatabase'
import { setViewportTabletUp } from '@/test/viewport'
import { addDaysToKey, todayKey } from '@/utils/dates'
import { formatDayLong } from '@/utils/taskPresentation'

const today = todayKey()
const yesterday = addDaysToKey(today, -1)
const tomorrow = addDaysToKey(today, 1)

describe('TodayPage (S2)', () => {
  beforeEach(resetDatabase)

  it('AC1.1 / AC1.3 shows three labeled blocks with empty states', async () => {
    renderWithApp('/')
    expect(await screen.findByRole('heading', { level: 1, name: /, today$/ })).toBeInTheDocument()
    for (const block of ['Morning', 'Afternoon', 'Evening']) {
      expect(await screen.findByRole('region', { name: new RegExp(`^${block}`) })).toBeInTheDocument()
    }
    expect(screen.getByText('Nothing planned for the morning.')).toBeInTheDocument()
    expect(screen.getByText('Nothing planned for the afternoon.')).toBeInTheDocument()
    expect(screen.getByText('Nothing planned for the evening.')).toBeInTheDocument()
    expect(screen.getByText('Tip: add companies in Settings to color-code your tasks.')).toBeInTheDocument()
  })

  it('AC1.2 shows each task as a note in its block', async () => {
    await createTask({ title: 'Standup', dayKey: today, block: 'morning' })
    await createTask({ title: 'Client call', dayKey: today, block: 'afternoon' })
    renderWithApp('/')
    const morning = await screen.findByRole('region', { name: /^Morning/ })
    expect(within(morning).getByRole('article', { name: /^Standup/ })).toBeInTheDocument()
    const afternoon = screen.getByRole('region', { name: /^Afternoon/ })
    expect(within(afternoon).getByRole('article', { name: /^Client call/ })).toBeInTheDocument()
  })

  it('DAC1 creates a task in 3 interactions: N, type, Enter', async () => {
    const { user } = renderWithApp('/')
    await screen.findByRole('region', { name: /^Morning/ })
    await user.keyboard('n')
    const dialog = await screen.findByRole('dialog', { name: 'New task' })
    await user.type(within(dialog).getByLabelText('Title'), 'Write report{Enter}')

    expect(await screen.findByRole('article', { name: /^Write report/ })).toBeInTheDocument()
    expect(await screen.findByText('Task added')).toBeInTheDocument()
    expect((await listTasksForDay(today)).map((t) => t.title)).toEqual(['Write report'])
  })

  it('“Add a task” in an empty block preselects that block', async () => {
    const { user } = renderWithApp('/')
    const evening = await screen.findByRole('region', { name: /^Evening/ })
    await user.click(within(evening).getByRole('button', { name: 'Add a task' }))
    const dialog = await screen.findByRole('dialog', { name: 'New task' })
    await user.type(within(dialog).getByLabelText('Title'), 'Read{Enter}')
    await waitFor(async () => expect((await listTasksForDay(today))[0]?.block).toBe('evening'))
  })

  it('AC2.2 edits a task from its title', async () => {
    const task = await createTask({ title: 'Standup', dayKey: today, block: 'morning' })
    const { user } = renderWithApp('/')
    await user.click(await screen.findByRole('button', { name: 'Edit Standup' }))
    const dialog = await screen.findByRole('dialog', { name: 'Edit task' })
    const title = within(dialog).getByLabelText('Title')
    await user.clear(title)
    await user.type(title, 'Daily standup{Enter}')
    await waitFor(async () => expect((await getTask(task.id))?.title).toBe('Daily standup'))
    expect(await screen.findByText('Changes saved')).toBeInTheDocument()
  })

  it('AC4.1 cycles status from the note', async () => {
    const task = await createTask({ title: 'Standup', dayKey: today, block: 'morning' })
    const { user } = renderWithApp('/')
    await user.click(await screen.findByRole('button', { name: 'Status: To Do. Change to In Progress' }))
    await user.click(await screen.findByRole('button', { name: 'Status: In Progress. Change to Done' }))
    await waitFor(async () => expect((await getTask(task.id))?.status).toBe('done'))
  })

  it('AC2.3 asks before deleting, then removes the task', async () => {
    const task = await createTask({ title: 'Standup', dayKey: today, block: 'morning' })
    const { user } = renderWithApp('/')
    await user.click(await screen.findByRole('button', { name: 'Options for Standup' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Delete task' }))
    const dialog = await screen.findByRole('alertdialog', { name: 'Delete this task?' })
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }))
    await waitFor(async () => expect(await getTask(task.id)).toBeUndefined())
    expect(await screen.findByText('Task deleted')).toBeInTheDocument()
  })

  it('AC18.1 Undo after a delete puts the task back', async () => {
    const task = await createTask({ title: 'Standup', dayKey: today, block: 'morning' })
    const { user } = renderWithApp('/')
    await user.click(await screen.findByRole('button', { name: 'Options for Standup' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Delete task' }))
    const dialog = await screen.findByRole('alertdialog', { name: 'Delete this task?' })
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }))
    await user.click(await screen.findByRole('button', { name: 'Undo' }))
    await waitFor(async () => expect(await getTask(task.id)).toBeDefined())
    expect(await screen.findByText('Task restored')).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: 'Options for Standup' })).toBeInTheDocument()
  })

  it('AC3.2 moves a task to another block from the menu', async () => {
    const task = await createTask({ title: 'Standup', dayKey: today, block: 'morning' })
    const { user } = renderWithApp('/')
    await user.click(await screen.findByRole('button', { name: 'Options for Standup' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Move to Evening' }))
    await waitFor(async () => expect((await getTask(task.id))?.block).toBe('evening'))
    expect(await screen.findByText('Task moved')).toBeInTheDocument()
  })

  it('AC3.2 reorders a task from the menu', async () => {
    await createTask({ title: 'First', dayKey: today, block: 'morning' })
    await createTask({ title: 'Second', dayKey: today, block: 'morning' })
    const { user } = renderWithApp('/')
    await user.click(await screen.findByRole('button', { name: 'Options for Second' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Move up' }))
    await waitFor(async () =>
      expect((await listTasksForDay(today)).map((t) => t.title)).toEqual(['Second', 'First']),
    )
  })

  it('D2 asks before moving a timed task to a block that doesn’t contain its time', async () => {
    const task = await createTask({
      title: 'Client call',
      dayKey: today,
      block: 'afternoon',
      startTime: '14:00',
    })
    const { user } = renderWithApp('/')
    await user.click(await screen.findByRole('button', { name: 'Options for Client call' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Move to Evening' }))

    const dialog = await screen.findByRole('alertdialog', { name: 'Move to Evening?' })
    expect(dialog).toHaveTextContent('This task starts at 2:00 PM, which is in the afternoon.')
    await user.click(within(dialog).getByRole('button', { name: 'Remove time and move' }))
    await waitFor(async () =>
      expect(await getTask(task.id)).toMatchObject({ block: 'evening', startTime: null }),
    )
  })

  it('D2 Cancel leaves the timed task where it was', async () => {
    const task = await createTask({
      title: 'Client call',
      dayKey: today,
      block: 'afternoon',
      startTime: '14:00',
    })
    const { user } = renderWithApp('/')
    await user.click(await screen.findByRole('button', { name: 'Options for Client call' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Move to Evening' }))
    const dialog = await screen.findByRole('alertdialog', { name: 'Move to Evening?' })
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    expect(await getTask(task.id)).toMatchObject({ block: 'afternoon', startTime: '14:00' })
  })

  it('M opens the focused note’s menu', async () => {
    await createTask({ title: 'Standup', dayKey: today, block: 'morning' })
    const { user } = renderWithApp('/')
    ;(await screen.findByRole('button', { name: 'Status: To Do. Change to In Progress' })).focus()
    await user.keyboard('m')
    expect(await screen.findByRole('menuitem', { name: 'Edit' })).toBeInTheDocument()
  })

  it('shows the company on its tasks', async () => {
    const acme = await createCompany({ name: 'Acme', colorId: 'teal' })
    await createTask({ title: 'Standup', dayKey: today, block: 'morning', companyId: acme.id })
    renderWithApp('/')
    expect(await screen.findByRole('article', { name: 'Standup, Acme, To Do' })).toBeInTheDocument()
  })

  it('navigates days with the buttons and shortcuts', async () => {
    const { user, router } = renderWithApp('/')
    await screen.findByRole('region', { name: /^Morning/ })
    await user.click(screen.getByRole('button', { name: 'Next day' }))
    expect(router.state.location.pathname).toBe(`/day/${tomorrow}`)
    expect(
      await screen.findByRole('heading', { level: 1, name: formatDayLong(tomorrow) }),
    ).toBeInTheDocument()
    await user.keyboard('t')
    expect(router.state.location.pathname).toBe('/')
    await user.keyboard('[[') // '[[' types a literal '['
    expect(router.state.location.pathname).toBe(`/day/${yesterday}`)
  })

  it('past days are read-only', async () => {
    await createTask({ title: 'Old task', dayKey: yesterday, block: 'morning' })
    renderWithApp(`/day/${yesterday}`)
    expect(await screen.findByText(/Tasks from past days can’t be edited\./)).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: 'Edit Old task' })).toBeDisabled()
    expect(screen.getByRole('button', { name: /^Status:/ })).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Options for Old task' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add task' })).not.toBeInTheDocument()
  })

  it('future days can be planned', async () => {
    const { user } = renderWithApp(`/day/${tomorrow}`)
    await screen.findByRole('region', { name: /^Morning/ })
    await user.keyboard('n')
    const dialog = await screen.findByRole('dialog', { name: 'New task' })
    await user.type(within(dialog).getByLabelText('Title'), 'Plan ahead{Enter}')
    await waitFor(async () =>
      expect((await listTasksForDay(tomorrow)).map((t) => t.title)).toEqual(['Plan ahead']),
    )
  })

  it('phones show one block at a time as tabs with counts', async () => {
    setViewportTabletUp(false)
    await createTask({ title: 'Standup', dayKey: today, block: 'morning' })
    const { user } = renderWithApp('/')
    const tabs = await screen.findAllByRole('tab')
    expect(tabs.map((t) => t.textContent)).toEqual(['Morning1', 'Afternoon0', 'Evening0'])
    await user.click(screen.getByRole('tab', { name: /^Morning/ }))
    expect(await screen.findByRole('article', { name: /^Standup/ })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Add task' }).length).toBeGreaterThan(0)
  })
})
