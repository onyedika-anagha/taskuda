import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { saveCloseout } from '@/services/db/closeoutRepository'
import { createTask } from '@/services/db/taskRepository'
import { renderWithApp } from '@/test/renderWithApp'
import { resetDatabase } from '@/test/resetDatabase'
import { addDaysToKey, todayKey } from '@/utils/dates'

describe('Stats (S7f, PRD FR17)', () => {
  beforeEach(resetDatabase)

  it('shows the empty state before the first closeout', async () => {
    renderWithApp('/settings/stats')
    expect(await screen.findByText('Your stats appear after your first closeout.')).toBeInTheDocument()
  })

  it('AC17.1 shows M1, M2 and M3 from local data', async () => {
    const today = todayKey()
    await saveCloseout({
      dayKey: today,
      startedAt: 0,
      finishedAt: 1,
      reportCopiedAt: 4 * 60_000,
      rating: 4,
      reflection: '',
      outcomes: {},
    })
    await createTask({ title: 'Forgotten', dayKey: addDaysToKey(today, -2), block: 'morning' })

    renderWithApp('/settings/stats')
    const dropped = await screen.findByText('Tasks dropped without a decision')
    expect(dropped.nextElementSibling).toHaveTextContent('1')
    expect(screen.getByText('Closeout streak (working days)').nextElementSibling).toHaveTextContent(/^[01]$/)
    expect(screen.getByText('Median time to report').nextElementSibling).toHaveTextContent('4.0 min')
  })
})
