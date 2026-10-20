import { screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { getCloseout } from '@/services/db/closeoutRepository'
import { createTask, getTask, listTasksForDay, setTaskStatus } from '@/services/db/taskRepository'
import { setWorkingDays } from '@/services/workday/workdaySettings'
import { useCloseoutStore } from '@/stores/closeoutStore'
import { renderWithApp } from '@/test/renderWithApp'
import { resetDatabase } from '@/test/resetDatabase'
import { addDaysToKey, todayKey } from '@/utils/dates'

const today = todayKey()
const tomorrow = addDaysToKey(today, 1)
const yesterday = addDaysToKey(today, -1)

async function openCloseout(path = '/') {
  const app = renderWithApp(path)
  await app.user.click(await screen.findByRole('button', { name: 'Close out day' }))
  const dialog = await screen.findByRole('dialog', { name: /^Close out / })
  return { ...app, dialog }
}

describe('Closeout (S5)', () => {
  beforeEach(async () => {
    useCloseoutStore.setState({ view: { mode: 'closed' } })
    await resetDatabase()
    // Every day is a working day, so carryover lands on tomorrow whatever day the tests run.
    await setWorkingDays([0, 1, 2, 3, 4, 5, 6])
  })

  it('DAC4 closes out a day with 5 unfinished tasks in 8 interactions and carries them over', async () => {
    for (const title of ['A', 'B', 'C', 'D', 'E'])
      await createTask({ title, dayKey: today, block: 'morning' })
    const app = renderWithApp('/')
    const { user } = app

    await user.click(await screen.findByRole('button', { name: 'Close out day' })) // 1
    const dialog = await screen.findByRole('dialog', { name: /^Close out / })
    await user.click(within(dialog).getByRole('button', { name: 'Carry over all' })) // 2
    await user.click(within(dialog).getByRole('button', { name: 'Next' })) // 3
    await user.click(within(dialog).getByRole('radio', { name: /^4/ })) // 4
    await user.click(within(dialog).getByRole('button', { name: 'Next' })) // 5
    await user.click(within(dialog).getByRole('button', { name: 'Skip' })) // 6
    await user.click(within(dialog).getByRole('button', { name: 'Copy report' })) // 7
    await user.click(within(dialog).getByRole('button', { name: 'Finish day' })) // 8

    expect(await screen.findByText('Day closed. 5 tasks carried to tomorrow.')).toBeInTheDocument()
    expect(await screen.findByText(/^Day closed at /)).toBeInTheDocument()
    expect((await listTasksForDay(tomorrow)).map((t) => t.title)).toEqual(['A', 'B', 'C', 'D', 'E'])
    const closeout = await getCloseout(today)
    expect(closeout).toMatchObject({ rating: 4 })
    expect(closeout?.reportCopiedAt).toBeGreaterThanOrEqual(closeout?.startedAt ?? Infinity)
  })

  it('AC10.1 Next explains what is missing until every task has a decision', async () => {
    const a = await createTask({ title: 'A', dayKey: today, block: 'morning' })
    await createTask({ title: 'B', dayKey: today, block: 'morning' })
    const { user, dialog } = await openCloseout()

    expect(within(dialog).getByText('2 tasks still need a decision')).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Next' }))
    expect(within(dialog).getByText('Step 1 of 4: Unfinished')).toBeInTheDocument()

    const group = within(dialog).getByRole('group', { name: 'A' })
    await user.click(within(group).getByRole('radio', { name: 'Delete' }))
    expect(within(dialog).getByText('1 task still needs a decision')).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Carry over all' }))
    await user.click(within(dialog).getByRole('button', { name: 'Next' }))
    expect(await within(dialog).findByText('Step 2 of 4: Reflect')).toBeInTheDocument()

    // The explicit Delete wasn't overwritten by "Carry over all".
    await user.click(within(dialog).getByRole('button', { name: 'Back' }))
    expect(
      within(within(dialog).getByRole('group', { name: 'A' })).getByRole('radio', { name: 'Delete' }),
    ).toBeChecked()
    expect(a.id).toBeTruthy()
  })

  it('shows “Everything’s done” when nothing is unfinished', async () => {
    const task = await createTask({ title: 'A', dayKey: today, block: 'morning' })
    await setTaskStatus(task.id, 'done')
    const { dialog } = await openCloseout()
    expect(within(dialog).getByText('Everything’s done. Nice.')).toBeInTheDocument()
  })

  it('AC10.2 a rating is required to continue', async () => {
    const { user, dialog } = await openCloseout()
    await user.click(within(dialog).getByRole('button', { name: 'Next' }))
    await user.click(await within(dialog).findByRole('button', { name: 'Next' }))
    expect(await within(dialog).findByText('Pick a rating to continue.')).toBeInTheDocument()
    await user.click(within(dialog).getByRole('radio', { name: /^3/ }))
    expect(within(dialog).queryByText('Pick a rating to continue.')).not.toBeInTheDocument()
  })

  it('DAC13 leaving and reopening resumes at the same step with the same choices', async () => {
    await createTask({ title: 'A', dayKey: today, block: 'morning' })
    const { user, dialog } = await openCloseout()
    await user.click(within(dialog).getByRole('button', { name: 'Carry over all' }))
    await user.click(within(dialog).getByRole('button', { name: 'Next' }))
    await user.type(await within(dialog).findByLabelText('Anything worth remembering? (optional)'), 'Busy')

    await user.keyboard('{Escape}')
    const leave = await screen.findByRole('alertdialog', { name: 'Leave closeout?' })
    expect(leave).toHaveTextContent('Your choices so far will be kept.')
    await user.click(within(leave).getByRole('button', { name: 'Leave' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: 'Close out day' }))
    const reopened = await screen.findByRole('dialog', { name: /^Close out / })
    expect(within(reopened).getByText('Step 2 of 4: Reflect')).toBeInTheDocument()
    expect(within(reopened).getByLabelText('Anything worth remembering? (optional)')).toHaveValue('Busy')
  })

  it('“Keep going” returns to the closeout', async () => {
    const { user } = await openCloseout()
    await user.keyboard('{Escape}')
    const leave = await screen.findByRole('alertdialog', { name: 'Leave closeout?' })
    await user.click(within(leave).getByRole('button', { name: 'Keep going' }))
    expect(await screen.findByRole('dialog', { name: /^Close out / })).toBeInTheDocument()
  })

  it('an already-closed day offers the report or closing out again', async () => {
    const { user, dialog } = await openCloseout()
    await user.click(within(dialog).getByRole('button', { name: 'Next' }))
    await user.click(await within(dialog).findByRole('radio', { name: /^5/ }))
    await user.click(within(dialog).getByRole('button', { name: 'Next' }))
    await user.click(await within(dialog).findByRole('button', { name: 'Skip' }))
    await user.click(await within(dialog).findByRole('button', { name: 'Finish day' }))
    expect(await screen.findByText('Day closed.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Close out day' }))
    const again = await screen.findByRole('dialog', { name: /^Close out / })
    expect(within(again).getByText(/^You closed out today at /)).toBeInTheDocument()
    expect(within(again).getByRole('link', { name: 'View report' })).toHaveAttribute(
      'href',
      `/report?date=${today}`,
    )
    await user.click(within(again).getByRole('button', { name: 'Close out again' }))
    expect(await within(again).findByText('Step 1 of 4: Unfinished')).toBeInTheDocument()
  })

  it('a forgotten past day can still be closed out; its tasks carry to the day after', async () => {
    const task = await createTask({ title: 'Old', dayKey: yesterday, block: 'evening' })
    const { user, dialog } = await openCloseout(`/day/${yesterday}`)
    await user.click(within(dialog).getByRole('button', { name: 'Carry over all' }))
    await user.click(within(dialog).getByRole('button', { name: 'Next' }))
    await user.click(await within(dialog).findByRole('radio', { name: /^2/ }))
    await user.click(within(dialog).getByRole('button', { name: 'Next' }))
    await user.click(await within(dialog).findByRole('button', { name: 'Skip' }))
    await user.click(await within(dialog).findByRole('button', { name: 'Finish day' }))

    await waitFor(async () => expect((await getTask(task.id))?.carriedToTaskId).toBeTruthy())
    expect((await listTasksForDay(today)).map((t) => t.title)).toEqual(['Old'])
  })

  it('future days have no closeout', async () => {
    renderWithApp(`/day/${tomorrow}`)
    await screen.findByRole('region', { name: /^Morning/ })
    expect(screen.queryByRole('button', { name: 'Close out day' })).not.toBeInTheDocument()
  })
})
