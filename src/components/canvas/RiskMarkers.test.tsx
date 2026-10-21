import { act, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createTask } from '@/services/db/taskRepository'
import { installFakeSpeech, removeFakeSpeech } from '@/test/fakeSpeech'
import { renderWithApp } from '@/test/renderWithApp'
import { resetDatabase } from '@/test/resetDatabase'
import { setViewport } from '@/test/viewport'
import { fromDayKey, todayKey } from '@/utils/dates'

function todayAt(h: number, m: number): Date {
  const date = fromDayKey(todayKey())
  date.setHours(h, m, 0, 0)
  return date
}

describe('At-risk markers on Today (PRD FR31)', () => {
  beforeEach(async () => {
    await resetDatabase()
    // Only the clock and the minute tick are faked; Dexie and React keep their real timers.
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] })
  })
  afterEach(() => {
    vi.useRealTimers()
    removeFakeSpeech()
  })

  it('AC31.6 / AC31.7 a task turns Overdue within a minute, silently', async () => {
    setViewport('desktop')
    const { speechSynthesis } = installFakeSpeech()
    vi.setSystemTime(todayAt(10, 0))
    await createTask({
      title: 'Send invoice',
      dayKey: todayKey(),
      block: 'morning',
      dueDate: todayKey(),
      dueTime: '10:30',
    })
    renderWithApp('/')

    expect(await screen.findByText('Due today 10:30 AM')).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(31 * 60_000))
    expect(await screen.findByText('Overdue · due 10:30 AM')).toBeInTheDocument()
    expect(
      screen.getByRole('article', { name: /^Send invoice, To Do, overdue, due 10:30 AM/ }),
    ).toBeInTheDocument()

    expect(speechSynthesis.speak).not.toHaveBeenCalled()
    expect(document.querySelector('[data-sonner-toast]')).toBeNull()
  })
})
