import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Toaster } from 'sonner'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ReminderCatchup } from '@/components/canvas/ReminderCatchup'
import { saveCloseout } from '@/services/db/closeoutRepository'
import { createTask, getTask, listTasksForDay, setTaskStatus } from '@/services/db/taskRepository'
import { setLeadMinutes, setVoiceEnabled } from '@/services/voice/voiceSettings'
import { setQuietHours, setWorkingDays } from '@/services/workday/workdaySettings'
import { useCloseoutNudgeStore } from '@/stores/closeoutNudgeStore'
import { useReminderStore } from '@/stores/reminderStore'
import { installFakeSpeech, removeFakeSpeech } from '@/test/fakeSpeech'
import { resetDatabase } from '@/test/resetDatabase'
import { todayKey } from '@/utils/dates'
import { checkReminders } from './useReminderTicks'

const today = todayKey()
const [y, m, d] = today.split('-').map(Number)
const at = (hour: number, minute = 0) => new Date(y, m - 1, d, hour, minute).getTime()

describe('reminder checks (PRD FR9)', () => {
  let speech: ReturnType<typeof installFakeSpeech>

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(at(8))
    window.localStorage.clear()
    window.localStorage.setItem('taskuda.welcomeDone', '1')
    useReminderStore.setState({ missed: [] })
    useCloseoutNudgeStore.setState({ dismissedDay: null })
    await resetDatabase()
    // Every day is a working day, so the nudge tests pass whatever day they run on.
    await setWorkingDays([0, 1, 2, 3, 4, 5, 6])
    speech = installFakeSpeech()
    await createTask({ title: 'Client call', dayKey: today, block: 'afternoon', startTime: '14:00' })
  })
  afterEach(() => {
    removeFakeSpeech()
    vi.useRealTimers()
  })

  it('AC9.1 / AC9.2 / DAC12 speaks "Up next" and "Starting now" on time, each with a toast', async () => {
    render(<Toaster />)
    await checkReminders(at(13, 54), true)
    expect(speech.spoken).toEqual([])

    await checkReminders(at(13, 55) + 5000, true)
    expect(speech.spoken.map((s) => s.text)).toEqual(['Up next at 2:00 PM: Client call.'])
    expect(await screen.findByText('Up next at 2:00 PM: Client call.')).toBeInTheDocument()

    await checkReminders(at(14) + 5000, true)
    expect(speech.spoken.map((s) => s.text)).toEqual([
      'Up next at 2:00 PM: Client call.',
      'Starting now: Client call.',
    ])
    expect(await screen.findByText('Starting now: Client call.')).toBeInTheDocument()
  })

  it('doesn’t repeat a reminder after a reload', async () => {
    await checkReminders(at(14) + 5000, true)
    await checkReminders(at(14) + 20_000, true)
    expect(speech.spoken).toHaveLength(1)
  })

  it('uses the lead time from Settings', async () => {
    await setLeadMinutes(15)
    await checkReminders(at(13, 45) + 1000, true)
    expect(speech.spoken.map((s) => s.text)).toEqual(['Up next at 2:00 PM: Client call.'])
  })

  it('AC9.3 with voice off, reminders still show but aren’t spoken', async () => {
    render(<Toaster />)
    await setVoiceEnabled(false)
    await checkReminders(at(14) + 1000, true)
    expect(speech.spoken).toEqual([])
    expect((await screen.findAllByText('Starting now: Client call.')).length).toBeGreaterThan(0)
  })

  it('AC9.5 reminders due while in the background are listed, not spoken, until dismissed', async () => {
    render(<ReminderCatchup />)
    await checkReminders(at(14, 30), false)
    expect(speech.spoken).toEqual([])
    expect(
      await screen.findByText('You missed 2 reminders while Taskuda was in the background.'),
    ).toBeInTheDocument()
    expect(screen.getByText(/Starting now: Client call\./)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(screen.queryByText(/You missed/)).not.toBeInTheDocument()
  })

  describe('Snooze and Mark done from the reminder (PRD FR22)', () => {
    it('AC22.1 / AC22.4 the reminder stays with Snooze 5 min, Snooze 15 min and Mark done', async () => {
      render(<Toaster />)
      await checkReminders(at(14) + 5000, true)
      expect(await screen.findByText('Starting now: Client call.')).toBeInTheDocument()
      for (const name of ['Snooze 5 min', 'Snooze 15 min', 'Mark done', 'Close']) {
        expect(screen.getByRole('button', { name })).toBeInTheDocument()
      }
      // Nothing took focus away from the page (design DAC18).
      expect(document.activeElement).toBe(document.body)
    })

    it('AC22.2 / DAC16 Snooze repeats the reminder after the chosen time', async () => {
      render(<Toaster />)
      vi.setSystemTime(at(14) + 5000)
      await checkReminders(at(14) + 5000, true)
      await userEvent.click(await screen.findByRole('button', { name: 'Snooze 5 min' }))
      expect(await screen.findByText('Reminder snoozed until 2:05 PM.')).toBeInTheDocument()
      await waitFor(() => expect(screen.queryByRole('button', { name: 'Mark done' })).not.toBeInTheDocument())

      await checkReminders(at(14, 4), true)
      expect(speech.spoken).toHaveLength(1)
      await checkReminders(at(14, 5) + 10_000, true)
      expect(speech.spoken.map((s) => s.text)).toEqual(['Starting now: Client call.', 'Starting now: Client call.'])
      expect(await screen.findByRole('button', { name: 'Mark done' })).toBeInTheDocument()
      // Only once.
      await checkReminders(at(14, 6), true)
      expect(speech.spoken).toHaveLength(2)
    })

    it('a snoozed reminder is dropped once its task is done', async () => {
      render(<Toaster />)
      vi.setSystemTime(at(14) + 5000)
      await checkReminders(at(14) + 5000, true)
      await userEvent.click(await screen.findByRole('button', { name: 'Snooze 15 min' }))
      const [task] = await listTasksForDay(today)
      await setTaskStatus(task.id, 'done')
      await checkReminders(at(14, 16), true)
      expect(speech.spoken).toHaveLength(1)
    })

    it('a snooze that comes due while in the background is listed as missed', async () => {
      render(<><Toaster /><ReminderCatchup /></>)
      vi.setSystemTime(at(14) + 5000)
      await checkReminders(at(14) + 5000, true)
      await userEvent.click(await screen.findByRole('button', { name: 'Snooze 5 min' }))
      await checkReminders(at(14, 30), false)
      expect(speech.spoken).toHaveLength(1)
      // "Up next" was already missed at 2:00; the snoozed "Starting now" joins it.
      expect(useReminderStore.getState().missed.map((r) => r.text)).toEqual([
        'Up next at 2:00 PM: Client call.',
        'Starting now: Client call.',
      ])
    })

    it('AC22.3 / DAC16 Mark done completes the task like the status toggle', async () => {
      render(<Toaster />)
      await checkReminders(at(14) + 5000, true)
      await userEvent.click(await screen.findByRole('button', { name: 'Mark done' }))
      const [task] = await listTasksForDay(today)
      await vi.waitFor(async () => expect((await getTask(task.id))?.status).toBe('done'))
      // The cheer plays, as with the toggle.
      await vi.waitFor(() => expect(speech.spoken).toHaveLength(2))
    })
  })

  describe('quiet hours (PRD FR23)', () => {
    it('AC23.2 nothing is spoken during quiet hours, but the reminder still shows', async () => {
      render(<Toaster />)
      await setQuietHours({ enabled: true, start: '13:00', end: '15:00' })
      vi.setSystemTime(at(14) + 5000)
      await checkReminders(at(14) + 5000, true)
      expect(speech.spoken).toEqual([])
      expect(await screen.findByText('Starting now: Client call.')).toBeInTheDocument()
    })
  })

  describe('closeout nudge (PRD FR21)', () => {
    it('AC21.2 / AC21.3 at the nudge time: one toast and one spoken line', async () => {
      render(<Toaster />)
      await checkReminders(at(17, 30) + 20_000, true)
      expect(await screen.findByText('It’s 5:30 PM. Ready to close out your day?')).toBeInTheDocument()
      expect(speech.spoken.map((s) => s.text)).toContain('It’s 5:30 PM. Time to close out your day.')
      const spoken = speech.spoken.length
      await checkReminders(at(17, 45), true)
      expect(speech.spoken).toHaveLength(spoken)
    })

    it('AC21.4 opened later that day: no toast or voice (the banner shows instead)', async () => {
      render(<Toaster />)
      await checkReminders(at(19), true)
      expect(speech.spoken.map((s) => s.text)).not.toContain('It’s 5:30 PM. Time to close out your day.')
      expect(screen.queryByText('It’s 5:30 PM. Ready to close out your day?')).not.toBeInTheDocument()
    })

    it('AC21.2 no nudge once the day is closed', async () => {
      await saveCloseout({
        dayKey: today,
        startedAt: 0,
        finishedAt: 1,
        reportCopiedAt: null,
        rating: 4,
        reflection: '',
        outcomes: {},
      })
      await checkReminders(at(17, 30) + 20_000, true)
      expect(speech.spoken.map((s) => s.text)).not.toContain('It’s 5:30 PM. Time to close out your day.')
    })
  })
})
