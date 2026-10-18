import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { DayNavigation } from '@/hooks/useDayNavigation'
import { formatDayLong, formatDayShort } from '@/utils/taskPresentation'

/** Previous / next / Today; the date label is the page heading. */
export function DayNavigator({ nav }: { nav: DayNavigation }) {
  return (
    <div className="flex min-w-0 items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="size-11"
        onClick={nav.goToPrevious}
        aria-label="Previous day"
      >
        <ChevronLeftIcon aria-hidden="true" />
      </Button>
      <h1
        aria-label={nav.isToday ? `${formatDayLong(nav.dayKey)}, today` : formatDayLong(nav.dayKey)}
        className="min-w-0 truncate text-base font-semibold sm:text-lg"
      >
        <span aria-hidden="true" className="sm:hidden">
          {formatDayShort(nav.dayKey)}
        </span>
        <span aria-hidden="true" className="hidden sm:inline">
          {formatDayLong(nav.dayKey)}
        </span>
      </h1>
      <Button variant="ghost" size="icon" className="size-11" onClick={nav.goToNext} aria-label="Next day">
        <ChevronRightIcon aria-hidden="true" />
      </Button>
      {!nav.isToday ? (
        <Button variant="outline" className="min-h-11" onClick={nav.goToToday}>
          Today
        </Button>
      ) : null}
    </div>
  )
}
