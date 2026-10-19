import { screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTask } from '@/services/db/taskRepository'
import { getVoiceSettings, setVoiceEnabled } from '@/services/voice/voiceSettings'
import { installFakeSpeech, removeFakeSpeech } from '@/test/fakeSpeech'
import { renderWithApp } from '@/test/renderWithApp'
import { resetDatabase } from '@/test/resetDatabase'
import { todayKey } from '@/utils/dates'
import { CHEERS } from '@/services/reminders/reminderPlan'

describe('Voice settings (S7e) and the completion cheer', () => {
  beforeEach(resetDatabase)
  afterEach(removeFakeSpeech)

  it('AC9.4 explains when the browser can’t speak, and disables the voice controls', async () => {
    renderWithApp('/settings/voice')
    expect(
      await screen.findByText('Your browser can’t speak reminders. You’ll still see them on screen.'),
    ).toBeInTheDocument()
    expect(await screen.findByRole('switch', { name: /Spoken reminders/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Play test' })).toBeDisabled()
  })

  it('AC9.3 turns voice off, sets the lead time and voice, and plays a test', async () => {
    const speech = installFakeSpeech()
    const { user } = renderWithApp('/settings/voice')
    await user.click(await screen.findByRole('button', { name: 'Play test' }))
    expect(speech.spoken.map((s) => s.text)).toEqual(['Up next at 2:00 PM: Client call.'])

    await user.click(screen.getByLabelText('Remind me before a task starts'))
    await user.click(await screen.findByRole('option', { name: '15 minutes' }))
    await user.click(screen.getByRole('combobox', { name: 'Voice' }))
    await user.click(await screen.findByRole('option', { name: 'Français (fr-FR)' }))
    await waitFor(async () =>
      expect(await getVoiceSettings()).toMatchObject({ leadMinutes: 15, voiceURI: 'voice-fr' }),
    )
    await user.click(screen.getByRole('button', { name: 'Play test' }))
    expect(speech.spoken.at(-1)?.voiceURI).toBe('voice-fr')

    await user.click(screen.getByRole('switch', { name: /Spoken reminders/ }))
    await waitFor(async () => expect((await getVoiceSettings()).enabled).toBe(false))
    expect(screen.getByRole('button', { name: 'Play test' })).toBeDisabled()
  })

  it('AC9.2 / DAC12 marking a task Done plays a short cheer with a matching toast', async () => {
    const speech = installFakeSpeech()
    await createTask({ title: 'Ship it', dayKey: todayKey(), block: 'morning' })
    const { user } = renderWithApp('/')
    await user.click(await screen.findByRole('button', { name: 'Status: To Do. Change to In Progress' }))
    expect(speech.spoken).toEqual([])
    await user.click(await screen.findByRole('button', { name: 'Status: In Progress. Change to Done' }))

    await waitFor(() => expect(speech.spoken).toHaveLength(1))
    const [{ text }] = speech.spoken
    expect(CHEERS).toContain(text)
    const toasts = screen.getByRole('region', { name: /Notifications/ })
    expect(await within(toasts).findByText(text)).toBeInTheDocument()
  })

  it('no cheer with voice off', async () => {
    const speech = installFakeSpeech()
    await setVoiceEnabled(false)
    await createTask({ title: 'Ship it', dayKey: todayKey(), block: 'morning' })
    const { user } = renderWithApp('/')
    await user.click(await screen.findByRole('button', { name: 'Status: To Do. Change to In Progress' }))
    await user.click(await screen.findByRole('button', { name: 'Status: In Progress. Change to Done' }))
    await screen.findByRole('article', { name: 'Ship it, Done' })
    expect(speech.spoken).toEqual([])
    for (const cheer of CHEERS) expect(screen.queryByText(cheer)).not.toBeInTheDocument()
  })
})
