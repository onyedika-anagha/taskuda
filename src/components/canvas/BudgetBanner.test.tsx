import { screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { addScreenTime } from '@/services/db/screenTimeRepository'
import { setCloseoutReminder, setDailyBudgetHours, setWorkingDays } from '@/services/workday/workdaySettings'
import { useBudgetStore } from '@/stores/budgetStore'
import { useCloseoutNudgeStore } from '@/stores/closeoutNudgeStore'
import { renderWithApp } from '@/test/renderWithApp'
import { resetDatabase } from '@/test/resetDatabase'
import { fromDayKey, todayKey } from '@/utils/dates'

const MESSAGE = 'You’ve spent 2 h in Taskuda today, past your 2 h budget. A short break might help.'
const banners = () => document.querySelectorAll('[data-slot="notice"]')

describe('Budget banner (PRD AC29.3, design F17)', () => {
  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    const sixPm = fromDayKey(todayKey())
    sixPm.setHours(18, 0, 0, 0)
    vi.setSystemTime(sixPm)
    window.localStorage.clear()
    window.localStorage.setItem('taskuda.welcomeDone', '1')
    useBudgetStore.setState({ warned: null, dismissed: null })
    useCloseoutNudgeStore.setState({ dismissedDay: null })
    await resetDatabase()
    await setWorkingDays([0, 1, 2, 3, 4, 5, 6])
    await setCloseoutReminder(null)
    await setDailyBudgetHours(2)
    await addScreenTime(new Map([[todayKey(), 2 * 3_600_000 + 60_000]]))
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('shows past the budget, and Dismiss hides it; nothing else is blocked', async () => {
    const { user } = renderWithApp('/')
    const dismiss = await screen.findByRole('button', { name: 'Dismiss' })
    expect(banners()[0]).toHaveTextContent(MESSAGE)
    await user.click(dismiss)
    expect(banners()).toHaveLength(0)
    expect(screen.getAllByRole('button', { name: /add task/i }).length).toBeGreaterThan(0)
  })

  it('waits while the offline notice and the nudge banner already show (at most two)', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    await setCloseoutReminder('17:30')
    renderWithApp('/')
    await screen.findByRole('button', { name: 'Not today' })
    // Only the nudge banner; the budget message may still show as a toast, which isn't a banner.
    expect(banners()).toHaveLength(1)
    expect(banners()[0]).not.toHaveTextContent(MESSAGE)
  })
})
