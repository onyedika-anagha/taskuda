import { screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { saveCloseout } from '@/services/db/closeoutRepository'
import { setCloseoutReminder, setWorkingDays } from '@/services/workday/workdaySettings'
import { useAnnouncerStore } from '@/stores/announcerStore'
import { useCloseoutNudgeStore } from '@/stores/closeoutNudgeStore'
import { useCloseoutStore } from '@/stores/closeoutStore'
import { renderWithApp } from '@/test/renderWithApp'
import { resetDatabase } from '@/test/resetDatabase'
import { addDaysToKey, fromDayKey, todayKey } from '@/utils/dates'

const MESSAGE = 'It’s 5:30 PM. Ready to close out your day?'

/** The banner itself, so its Close out day isn't confused with the app bar's. */
async function banner(): Promise<HTMLElement> {
  await screen.findByRole('button', { name: 'Not today' })
  return document.querySelector('[data-slot="notice"]') as HTMLElement
}

/** The banner, if it shows (the message also sits in the screen-reader announcer). */
const bannerShown = () => document.querySelector('[data-slot="notice"]') !== null

function todayAt(h: number, m: number): Date {
  const date = fromDayKey(todayKey())
  date.setHours(h, m, 0, 0)
  return date
}

describe('Closeout nudge banner (PRD FR21, design F16)', () => {
  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(todayAt(18, 0))
    window.localStorage.clear()
    window.localStorage.setItem('taskuda.welcomeDone', '1')
    useCloseoutNudgeStore.setState({ dismissedDay: null })
    useCloseoutStore.setState({ view: { mode: 'closed' } })
    await resetDatabase()
    // Every day is a working day, so these pass whatever day they run on.
    await setWorkingDays([0, 1, 2, 3, 4, 5, 6])
  })
  afterEach(() => vi.useRealTimers())

  it('AC21.2 / DAC19 shows after the nudge time and opens the closeout in one click', async () => {
    const { user } = renderWithApp('/')
    await user.click(within(await banner()).getByRole('button', { name: 'Close out day' }))
    expect(await screen.findByRole('dialog', { name: /^Close out / })).toBeInTheDocument()
  })

  it('is announced politely, not as an interrupting alert', async () => {
    renderWithApp('/')
    const element = await banner()
    expect(element).toHaveTextContent(MESSAGE)
    expect(element).not.toHaveAttribute('role')
    expect(useAnnouncerStore.getState().message).toBe(MESSAGE)
  })

  it('AC21.3 “Not today” hides it', async () => {
    const { user } = renderWithApp('/')
    await user.click(await screen.findByRole('button', { name: 'Not today' }))
    await waitFor(() => expect(bannerShown()).toBe(false))
    expect(window.localStorage.getItem('taskuda.closeoutNudge.dismissed')).toBe(todayKey())
  })

  it('AC21.3 closing out removes it', async () => {
    renderWithApp('/')
    expect(await banner()).toHaveTextContent(MESSAGE)
    await saveCloseout({
      dayKey: todayKey(),
      startedAt: 0,
      finishedAt: 1,
      reportCopiedAt: null,
      rating: 4,
      reflection: '',
      outcomes: {},
    })
    await waitFor(() => expect(bannerShown()).toBe(false))
  })

  it('AC21.1 no banner before the nudge time or when it’s off', async () => {
    vi.setSystemTime(todayAt(17, 29))
    const first = renderWithApp('/')
    await screen.findByRole('region', { name: /^Morning/ })
    expect(bannerShown()).toBe(false)
    first.unmount()

    vi.setSystemTime(todayAt(18, 0))
    await setCloseoutReminder(null)
    renderWithApp('/')
    await screen.findByRole('region', { name: /^Morning/ })
    expect(bannerShown()).toBe(false)
  })

  it('F16.5 from another day, Close out day goes to today’s closeout', async () => {
    const { user, router } = renderWithApp(`/day/${addDaysToKey(todayKey(), 1)}`)
    expect(await banner()).toHaveTextContent(MESSAGE)
    await user.click(within(await banner()).getByRole('button', { name: 'Close out day' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
    expect(await screen.findByRole('dialog', { name: /^Close out / })).toBeInTheDocument()
    expect(useCloseoutStore.getState().view).toMatchObject({ mode: 'open', draft: { dayKey: todayKey() } })
  })
})
