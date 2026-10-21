import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/services/db/database'
import { setEyeBreaks, setQuietHours, setWorkingDays } from '@/services/workday/workdaySettings'
import { useEyeBreakStore } from '@/stores/eyeBreakStore'
import { resetDatabase } from '@/test/resetDatabase'
import { DEFAULT_EYE_BREAKS } from '@/types/workday'
import { checkEyeBreak, settleEyeBreak, snoozeEyeBreak } from './eyeBreakAlerts'

const speakAlert = vi.hoisted(() => vi.fn<(text: string) => Promise<boolean>>().mockResolvedValue(true))
vi.mock('@/services/voice/voiceAlerts', () => ({ speakAlert }))

const at = (h: number, m: number) => new Date(2026, 9, 21, h, m).getTime()
const outcomes = async () => (await db.eyeBreakLog.toArray()).map((e) => e.outcome)

describe('eye-break alerts (PRD FR28, design F15)', () => {
  const show = vi.fn<(missed: boolean) => void>()

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(at(9, 0))
    window.localStorage.clear()
    await resetDatabase()
    await setWorkingDays([0, 1, 2, 3, 4, 5, 6])
    await setEyeBreaks({ ...DEFAULT_EYE_BREAKS, enabled: true })
    useEyeBreakStore.setState({ lastPromptAt: null, snoozedUntil: null, openedAt: at(9, 0), open: null })
    show.mockClear()
    speakAlert.mockClear()
  })
  afterEach(() => vi.useRealTimers())

  it('AC28.2 / AC28.3 shows a prompt with a voice line, and Done is logged', async () => {
    await checkEyeBreak(at(9, 19), true, show)
    expect(show).not.toHaveBeenCalled()
    await checkEyeBreak(at(9, 20), true, show)
    expect(show).toHaveBeenCalledWith(false)
    expect(speakAlert).toHaveBeenCalledWith('Time for an eye break.')
    await settleEyeBreak('done')
    expect(await outcomes()).toEqual(['done'])
    // The next one is a full interval later.
    await checkEyeBreak(at(9, 39), true, show)
    expect(show).toHaveBeenCalledTimes(1)
    await checkEyeBreak(at(9, 40), true, show)
    expect(show).toHaveBeenCalledTimes(2)
  })

  it('Snooze 5 min brings the prompt back 5 minutes later', async () => {
    vi.setSystemTime(at(9, 20))
    await checkEyeBreak(at(9, 20), true, show)
    await snoozeEyeBreak(at(9, 20))
    expect(await outcomes()).toEqual(['snoozed'])
    await checkEyeBreak(at(9, 24), true, show)
    expect(show).toHaveBeenCalledTimes(1)
    await checkEyeBreak(at(9, 25), true, show)
    expect(show).toHaveBeenCalledTimes(2)
  })

  it('closing the prompt logs it as dismissed, once', async () => {
    await checkEyeBreak(at(9, 20), true, show)
    await settleEyeBreak('dismissed')
    await settleEyeBreak('dismissed')
    expect(await outcomes()).toEqual(['dismissed'])
  })

  it('F15.5 a prompt still open when the next comes due is replaced and logged as missed', async () => {
    await checkEyeBreak(at(9, 20), true, show)
    await checkEyeBreak(at(9, 40), true, show)
    expect(await outcomes()).toEqual(['missed'])
    await settleEyeBreak('done')
    expect(await outcomes()).toEqual(['missed', 'done'])
  })

  it('AC28.5 a prompt due in the background shows once on return, logged as missed, without speaking', async () => {
    await checkEyeBreak(at(9, 25), false, show)
    expect(show).not.toHaveBeenCalled()
    await checkEyeBreak(at(9, 50), true, show)
    expect(show).toHaveBeenCalledExactlyOnceWith(true)
    expect(speakAlert).not.toHaveBeenCalled()
    expect(await outcomes()).toEqual(['missed'])
    // Done on a missed prompt doesn't log it twice.
    await settleEyeBreak('done')
    expect(await outcomes()).toEqual(['missed'])
  })

  it('AC28.4 / AC23.3 quiet hours skip the prompt without logging it', async () => {
    await setQuietHours({ enabled: true, start: '09:00', end: '10:00' })
    await checkEyeBreak(at(9, 20), true, show)
    expect(show).not.toHaveBeenCalled()
    expect(await outcomes()).toEqual([])
  })
})
