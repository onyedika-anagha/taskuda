import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { saveCloseout } from '@/services/db/closeoutRepository'
import { createCompany } from '@/services/db/companyRepository'
import { db } from '@/services/db/database'
import { createTask } from '@/services/db/taskRepository'
import { logEyeBreak } from '@/services/db/eyeBreakRepository'
import { addScreenTime } from '@/services/db/screenTimeRepository'
import { setDailyBudgetHours, setEyeBreaks, setWorkingDays } from '@/services/workday/workdaySettings'
import { DEFAULT_EYE_BREAKS } from '@/types/workday'
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

  it('AC17.3 shows M6 as "No due dates yet" until a due date comes due', async () => {
    await saveCloseout({
      dayKey: todayKey(),
      startedAt: 0,
      finishedAt: 1,
      reportCopiedAt: null,
      rating: 4,
      reflection: '',
      outcomes: {},
    })
    renderWithApp('/settings/stats')
    const tile = await screen.findByText('Deadlines met')
    expect(tile.nextElementSibling).toHaveTextContent('—')
    expect(screen.getByText('No due dates yet.')).toBeInTheDocument()
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

  describe('M4, M5 and time in Taskuda (PRD AC17.2, FR29)', () => {
    const closeOutToday = () =>
      saveCloseout({
        dayKey: todayKey(),
        startedAt: 0,
        finishedAt: 1,
        reportCopiedAt: null,
        rating: 4,
        reflection: '',
        outcomes: {},
      })

    it('AC17.2 shows M4 and M5 as Off, with a link to Workday, while the features are off', async () => {
      await closeOutToday()
      renderWithApp('/settings/stats')
      const eye = await screen.findByText('Eye breaks taken')
      expect(eye.nextElementSibling).toHaveTextContent('Off')
      expect(screen.getByText('Eye breaks are off.')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Turn on in Workday' })).toHaveAttribute(
        'href',
        '/settings/workday',
      )
      expect(screen.getByText('Days within time budget').nextElementSibling).toHaveTextContent('Off')
      expect(screen.getByRole('link', { name: 'Set one in Workday' })).toHaveAttribute(
        'href',
        '/settings/workday',
      )
    })

    it('AC17.2 shows M4 and M5 from the local logs when on', async () => {
      await closeOutToday()
      await setWorkingDays([0, 1, 2, 3, 4, 5, 6])
      await setEyeBreaks({ ...DEFAULT_EYE_BREAKS, enabled: true })
      await setDailyBudgetHours(2)
      await logEyeBreak('done')
      await logEyeBreak('done')
      await logEyeBreak('done')
      await logEyeBreak('missed')
      const today = todayKey()
      await addScreenTime(
        new Map([
          [addDaysToKey(today, -1), 3_600_000],
          [addDaysToKey(today, -2), 3 * 3_600_000],
        ]),
      )

      renderWithApp('/settings/stats')
      expect((await screen.findByText('Eye breaks taken')).nextElementSibling).toHaveTextContent('75%')
      expect(screen.getByText('Days within time budget').nextElementSibling).toHaveTextContent('50%')
    })

    it('AC29.4 / AC29.5 / DAC21 labels in-app time as on this device, not total screen time', async () => {
      await addScreenTime(new Map([[todayKey(), 72 * 60_000]]))
      renderWithApp('/settings/stats')
      const line = await screen.findByText(/^Time in Taskuda today:/)
      expect(line).toHaveTextContent(
        'Time in Taskuda today: 1 h 12 min · 7-day average: 0 min (on this device, not total screen time)',
      )
    })
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
