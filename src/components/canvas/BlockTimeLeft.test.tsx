import { act, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithApp } from '@/test/renderWithApp'
import { resetDatabase } from '@/test/resetDatabase'
import { setViewport } from '@/test/viewport'
import { addDaysToKey, fromDayKey, todayKey } from '@/utils/dates'

/** Today at `h:m:s`, so the canvas still shows "today". */
function todayAt(h: number, m: number, s = 0): Date {
  const date = fromDayKey(todayKey())
  date.setHours(h, m, s, 0)
  return date
}

describe('Time left in the current block (PRD FR27)', () => {
  beforeEach(async () => {
    await resetDatabase()
    // Only the clock and the minute tick are faked; Dexie and React keep their real timers.
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] })
  })
  afterEach(() => vi.useRealTimers())

  it('AC27.1 shows the time left in the current block only, in its heading', async () => {
    setViewport('desktop')
    vi.setSystemTime(todayAt(10, 40))
    renderWithApp('/')
    const morning = await screen.findByRole('region', { name: /^Morning/ })
    expect(morning).toHaveAccessibleName(/Morning.*1 hour 20 minutes left/)
    expect(screen.getByText('1 h 20 min left')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: /^Afternoon/ })).not.toHaveAccessibleName(/left/)
  })

  it('AC27.2 / DAC20 moves to the next block within a minute of the boundary', async () => {
    setViewport('desktop')
    vi.setSystemTime(todayAt(11, 59, 30))
    renderWithApp('/')
    expect(await screen.findByText('1 min left')).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(45_000))
    expect(await screen.findByText('5 h left')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: /^Afternoon/ })).toHaveAccessibleName(/5 hours left/)
  })

  it('AC27.1 Evening shows no countdown', async () => {
    setViewport('desktop')
    vi.setSystemTime(todayAt(18, 0))
    renderWithApp('/')
    await screen.findByRole('region', { name: /^Evening/ })
    expect(screen.queryByText(/ left$/)).not.toBeInTheDocument()
  })

  it('AC27.3 other days show no countdown', async () => {
    setViewport('desktop')
    vi.setSystemTime(todayAt(10, 40))
    renderWithApp(`/day/${addDaysToKey(todayKey(), 1)}`)
    await screen.findByRole('region', { name: /^Morning/ })
    expect(screen.queryByText(/ left$/)).not.toBeInTheDocument()
  })

  it('phones show it under the tabs', async () => {
    setViewport('phone')
    vi.setSystemTime(todayAt(14, 15))
    renderWithApp('/')
    // Once in the hidden heading (for screen readers), once as the visible line under the tabs.
    const shown = (await screen.findAllByText('2 h 45 min left')).filter((el) => el.closest('p'))
    expect(shown).toHaveLength(1)
    expect(shown[0].closest('p')).toHaveAttribute('aria-hidden', 'true')
  })
})
