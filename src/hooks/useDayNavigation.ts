import { useCallback, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router'
import { addDaysToKey, isPastDay, isValidDayKey, todayKey } from '@/utils/dates'

export interface DayNavigation {
  dayKey: string
  isToday: boolean
  /** Past days are read-only (design spec Section 4). */
  isPast: boolean
  goToDay: (dayKey: string) => void
  goToToday: () => void
  goToPrevious: () => void
  goToNext: () => void
}

/** The day shown on S2, from the `/day/:date` route; `/` and invalid dates mean today. */
export function useDayNavigation(): DayNavigation {
  const { date } = useParams()
  const navigate = useNavigate()
  const today = todayKey()
  const dayKey = date && isValidDayKey(date) ? date : today

  const goToDay = useCallback((key: string) => navigate(key === todayKey() ? '/' : `/day/${key}`), [navigate])

  return useMemo(
    () => ({
      dayKey,
      isToday: dayKey === today,
      isPast: isPastDay(dayKey),
      goToDay,
      goToToday: () => goToDay(todayKey()),
      goToPrevious: () => goToDay(addDaysToKey(dayKey, -1)),
      goToNext: () => goToDay(addDaysToKey(dayKey, 1)),
    }),
    [dayKey, today, goToDay],
  )
}
