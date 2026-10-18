import { FileTextIcon, MoonIcon, PlusIcon } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'

interface DayActionsProps {
  dayKey: string
  /** Hidden on read-only days. */
  onAddTask?: () => void
  /** Hidden for future days. */
  onCloseOut?: () => void
}

/** App bar actions on tablet and desktop: Report, Close out day, + Add task. */
export function DayActions({ dayKey, onAddTask, onCloseOut }: DayActionsProps) {
  return (
    <>
      <Button asChild variant="ghost" className="min-h-11">
        <Link to={`/report?date=${dayKey}`}>
          <FileTextIcon aria-hidden="true" />
          Report
        </Link>
      </Button>
      {onCloseOut ? (
        <Button variant="outline" className="min-h-11" onClick={onCloseOut}>
          <MoonIcon aria-hidden="true" />
          Close out day
        </Button>
      ) : null}
      {onAddTask ? (
        <Button className="min-h-11" onClick={onAddTask} aria-keyshortcuts="n">
          <PlusIcon aria-hidden="true" />
          Add task
        </Button>
      ) : null}
    </>
  )
}

/** Phones: Report and Close out day in a bar along the bottom (design spec Section 4). */
export function BottomActionBar({ dayKey, onCloseOut }: Omit<DayActionsProps, 'onAddTask'>) {
  return (
    <nav
      aria-label="Day actions"
      className="fixed inset-x-0 bottom-0 z-20 flex gap-2 border-t bg-background/95 px-4 pt-2 pr-22 pb-[calc(0.5rem+env(safe-area-inset-bottom))] backdrop-blur md:hidden"
    >
      <Button asChild variant="ghost" className="min-h-11 flex-1">
        <Link to={`/report?date=${dayKey}`}>
          <FileTextIcon aria-hidden="true" />
          Report
        </Link>
      </Button>
      {onCloseOut ? (
        <Button variant="outline" className="min-h-11 flex-1" onClick={onCloseOut}>
          <MoonIcon aria-hidden="true" />
          Close out day
        </Button>
      ) : null}
    </nav>
  )
}
