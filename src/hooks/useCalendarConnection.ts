import { useState } from 'react'
import { toast } from 'sonner'
import { useCalendarStore } from '@/stores/calendarStore'
import type { CalendarListEntry } from '@/types/calendar'
import { googleConnectErrorMessage } from '@/utils/googleErrorMessages'

/** Click handlers for the Calendar card, with user-facing errors (design F9). */
export function useCalendarConnection() {
  const store = useCalendarStore()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run(action: () => Promise<void>, success?: string) {
    setBusy(true)
    setError(null)
    try {
      await action()
      if (success) toast.success(success)
    } catch (cause) {
      setError(googleConnectErrorMessage(cause, 'Google Calendar'))
    } finally {
      setBusy(false)
    }
  }

  return {
    busy,
    error,
    connect: () => run(store.connect, 'Google Calendar connected'),
    loadCalendars: () => run(store.loadCalendars),
    chooseCalendar: (calendar: CalendarListEntry) => run(() => store.chooseCalendar(calendar)),
    turnOff: () => run(store.turnOff, 'Calendar sync turned off. Your tasks and events stay as they are.'),
    syncNow: () => run(() => store.syncNow({ interactive: true })),
  }
}
