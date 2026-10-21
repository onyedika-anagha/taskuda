import { toast } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { addScreenTime } from '@/services/db/screenTimeRepository'
import { setDailyBudgetHours } from '@/services/workday/workdaySettings'
import { useBudgetStore } from '@/stores/budgetStore'
import { resetDatabase } from '@/test/resetDatabase'
import { checkBudget } from './budgetAlerts'

vi.mock('sonner', () => ({ toast: vi.fn<(message: string) => void>() }))

const NOW = new Date(2026, 9, 21, 15, 0).getTime()
const DAY = '2026-10-21'
const HOUR = 3_600_000

describe('checkBudget (PRD AC29.3)', () => {
  beforeEach(async () => {
    await resetDatabase()
    window.localStorage.clear()
    useBudgetStore.setState({ warned: null, dismissed: null })
    vi.mocked(toast).mockClear()
    await setDailyBudgetHours(2)
  })

  it('warns once when the budget is passed, and again only after another hour', async () => {
    await addScreenTime(new Map([[DAY, 2 * HOUR - 60_000]]))
    await checkBudget(NOW)
    expect(toast).not.toHaveBeenCalled()

    await addScreenTime(new Map([[DAY, 60_000]]))
    await checkBudget(NOW)
    await checkBudget(NOW)
    expect(toast).toHaveBeenCalledExactlyOnceWith(
      'You’ve spent 2 h in Taskuda today, past your 2 h budget. A short break might help.',
    )

    await addScreenTime(new Map([[DAY, 30 * 60_000]]))
    await checkBudget(NOW)
    expect(toast).toHaveBeenCalledTimes(1)

    await addScreenTime(new Map([[DAY, 30 * 60_000]]))
    await checkBudget(NOW)
    expect(toast).toHaveBeenLastCalledWith(
      'You’ve spent 3 h in Taskuda today, past your 2 h budget. A short break might help.',
    )
  })

  it('never warns with the budget off', async () => {
    await setDailyBudgetHours(null)
    await addScreenTime(new Map([[DAY, 9 * HOUR]]))
    await checkBudget(NOW)
    expect(toast).not.toHaveBeenCalled()
  })
})
