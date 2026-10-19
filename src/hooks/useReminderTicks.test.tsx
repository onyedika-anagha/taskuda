import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Toaster } from 'sonner'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ReminderCatchup } from '@/components/canvas/ReminderCatchup'
import { createTask } from '@/services/db/taskRepository'
import { setLeadMinutes, setVoiceEnabled } from '@/services/voice/voiceSettings'
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
    await resetDatabase()
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
})
