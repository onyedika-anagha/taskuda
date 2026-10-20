import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { saveCloseout } from '@/services/db/closeoutRepository'
import { createCompany } from '@/services/db/companyRepository'
import { db } from '@/services/db/database'
import { createTask } from '@/services/db/taskRepository'
import { makeTask } from '@/test/factories'
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

  describe('Carry-over (PRD FR26)', () => {
    it('AC26.4 shows the empty state with no past tasks', async () => {
      renderWithApp('/settings/stats')
      expect(await screen.findByText('Carry-over stats appear once you have past days.')).toBeInTheDocument()
    })

    it('AC26.1–AC26.3 shows rates by company name, the callout and tasks carried 3+ times', async () => {
      const today = todayKey()
      const past = addDaysToKey(today, -3)
      const acme = await createCompany({ name: 'Acme', colorId: 'teal' })
      await db.tasks.bulkAdd([
        ...[0, 1].map((i) =>
          makeTask({ id: `c${i}`, companyId: acme.id, dayKey: past, carriedToTaskId: 'x' }),
        ),
        ...[0, 1, 2].map((i) => makeTask({ id: `o${i}`, companyId: acme.id, dayKey: past, status: 'done' })),
        makeTask({
          id: 'doc',
          title: 'Write onboarding doc',
          companyId: acme.id,
          dayKey: today,
          carriedOverCount: 4,
        }),
      ])

      renderWithApp('/settings/stats')
      expect(await screen.findByText('Acme')).toBeInTheDocument()
      expect(screen.getByText('40% carried over')).toBeInTheDocument()
      expect(screen.getByText('Overall').nextElementSibling).toHaveTextContent('40%')
      expect(screen.getByText(/Acme — 40% of tasks carried over in the last 4 weeks\./)).toHaveTextContent(
        'Needs attention: Acme — 40% of tasks carried over in the last 4 weeks.',
      )
      expect(screen.getByText('Carried over 3+ times')).toBeInTheDocument()
      expect(screen.getByText(/Write onboarding doc/)).toHaveTextContent(
        'Write onboarding doc (Acme) — carried 4 times',
      )
      expect(screen.queryByText(acme.id)).not.toBeInTheDocument()
    })
  })
})
