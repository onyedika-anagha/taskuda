import { screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getCalendarSettings } from '@/services/calendar/calendarSettings'
import { createTask } from '@/services/db/taskRepository'
import { getSetting } from '@/services/db/settingsRepository'
import { forgetAccessToken } from '@/services/google/googleAuth'
import { useCalendarStore } from '@/stores/calendarStore'
import { installFakeCalendar } from '@/test/fakeCalendar'
import { installFakeGis, removeFakeGis } from '@/test/fakeGoogle'
import { renderWithApp } from '@/test/renderWithApp'
import { resetDatabase } from '@/test/resetDatabase'
import { todayKey } from '@/utils/dates'

describe('Integrations: Google Calendar card (S7b, F9)', () => {
  beforeEach(async () => {
    forgetAccessToken()
    useCalendarStore.setState({
      status: { state: 'loading' },
      calendarId: null,
      calendarName: null,
      calendars: [],
    })
    await resetDatabase()
  })
  afterEach(() => {
    removeFakeGis()
    vi.restoreAllMocks()
  })

  it('F9.1 connects to the main calendar, asking only for the narrow scopes, and syncs', async () => {
    const gis = installFakeGis()
    const calendar = installFakeCalendar()
    await createTask({ title: 'Client call', dayKey: todayKey(), block: 'afternoon', startTime: '14:00' })

    const { user } = renderWithApp('/settings/integrations')
    await user.click(await screen.findByRole('button', { name: 'Connect' }))
    expect(await screen.findByText('Google Calendar connected')).toBeInTheDocument()
    expect(await screen.findByText('Synced just now')).toBeInTheDocument()
    expect(gis.requests[0].scope).toBe(
      'https://www.googleapis.com/auth/calendar.events.owned https://www.googleapis.com/auth/calendar.calendarlist.readonly',
    )
    expect(calendar.live().map((e) => e.summary)).toEqual(['Client call'])
    expect(await getCalendarSettings()).toMatchObject({ enabled: true, calendarId: 'primary-id' })
  })

  it('F9.3 turning sync off keeps tasks and events', async () => {
    installFakeGis()
    const calendar = installFakeCalendar()
    await createTask({ title: 'Client call', dayKey: todayKey(), block: 'afternoon', startTime: '14:00' })
    const { user } = renderWithApp('/settings/integrations')
    await user.click(await screen.findByRole('button', { name: 'Connect' }))
    await screen.findByText('Synced just now')

    await user.click(screen.getByRole('button', { name: 'Turn off sync' }))
    const confirm = await screen.findByRole('alertdialog', { name: 'Turn off calendar sync?' })
    await user.click(within(confirm).getByRole('button', { name: 'Turn off sync' }))
    expect(await screen.findByRole('button', { name: 'Connect' })).toBeInTheDocument()
    expect(calendar.live()).toHaveLength(1)
    expect((await getCalendarSettings()).enabled).toBe(false)
  })

  it('F9.4 a Calendar error pauses sync with the reason and Try again', async () => {
    installFakeGis()
    const calendar = installFakeCalendar()
    const { user } = renderWithApp('/settings/integrations')
    await user.click(await screen.findByRole('button', { name: 'Connect' }))
    await screen.findByText('Synced just now')

    calendar.state.failNext = 500
    await user.click(screen.getByRole('button', { name: 'Sync now' }))
    expect(
      await screen.findByText('Calendar sync paused: Google Calendar returned an error.'),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText('Synced just now')).toBeInTheDocument()
  })

  it('switching calendars uses the new one', async () => {
    installFakeGis()
    const calendar = installFakeCalendar()
    const { user } = renderWithApp('/settings/integrations')
    await user.click(await screen.findByRole('button', { name: 'Connect' }))
    await screen.findByText('Synced just now')
    await user.click(screen.getByLabelText('Sync with'))
    await user.click(await screen.findByRole('option', { name: 'Work' }))
    await waitFor(async () => expect((await getCalendarSettings()).calendarId).toBe('work-id'))
    await waitFor(() =>
      expect(calendar.requests.some((r) => r.url.includes('/calendars/work-id/events'))).toBe(true),
    )
  })

  it('CR1 saves the user’s own Google client ID', async () => {
    const { user } = renderWithApp('/settings/integrations')
    await user.click(await screen.findByText('Advanced'))
    await user.type(screen.getByLabelText('Use your own Google client ID'), 'mine.apps.googleusercontent.com')
    await user.click(screen.getByRole('button', { name: 'Save client ID' }))
    await waitFor(async () =>
      expect(await getSetting('google.clientId', null)).toBe('mine.apps.googleusercontent.com'),
    )
  })
})
