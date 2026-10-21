import { CalendarIcon, IterationCwIcon, RepeatIcon, TriangleAlertIcon } from 'lucide-react'
import { forwardRef, type CSSProperties, type ReactNode } from 'react'
import { CompanyChip } from '@/components/company/CompanyChip'
import { cn } from '@/lib/utils'
import type { Company } from '@/types/company'
import type { RepeatKind } from '@/types/recurring'
import type { Task } from '@/types/task'
import { noteColorVariables } from '@/utils/noteColors'
import { overlapMarkerLabel } from '@/utils/overlapLabels'
import { REPEAT_MARKER } from '@/utils/recurrence'
import { carriedOverLabel, formatDuration, formatTime, taskAriaLabel } from '@/utils/taskPresentation'
import { StatusToggle } from './StatusToggle'

interface StickyNoteProps {
  task: Task
  company: Company | undefined
  readOnly: boolean
  /** Tasks this one clashes with on its day (PRD FR25). */
  overlaps?: Task[]
  /** The task repeats (PRD AC20.2). */
  repeatKind?: RepeatKind | null
  isDragging?: boolean
  style?: CSSProperties
  onOpen: () => void
  onCycleStatus: () => void
  menu?: ReactNode
  dragHandle?: ReactNode
}

/** One task as a paper note tinted with its company's color (design spec Section 10). */
export const StickyNote = forwardRef<HTMLElement, StickyNoteProps>(function StickyNote(
  {
    task,
    company,
    readOnly,
    overlaps = [],
    repeatKind = null,
    isDragging = false,
    style,
    onOpen,
    onCycleStatus,
    menu,
    dragHandle,
  },
  ref,
) {
  const label = taskAriaLabel(task, company, overlaps, repeatKind)

  return (
    <article
      ref={ref}
      aria-label={label}
      data-task-id={task.id}
      data-status={task.status}
      style={{ ...noteColorVariables(company?.colorId), ...style }}
      className={cn(
        'group relative rounded-lg border-t-[3px] shadow-sm transition-shadow',
        'border-(--note-edge) bg-(--note-tint) text-(--note-text)',
        'dark:border-(--note-edge-dark) dark:bg-(--note-tint-dark) dark:text-(--note-text-dark)',
        task.status === 'in_progress' && 'border-t-[6px]',
        task.status === 'done' && 'saturate-[.35]',
        isDragging && 'opacity-60 shadow-lg ring-2 ring-ring',
      )}
    >
      <div className="flex flex-col gap-1 px-3 pt-2">
        {company || task.startTime ? (
          <div className="flex items-center justify-between gap-2">
            {company ? <CompanyChip company={company} /> : <span />}
            {task.startTime ? (
              <span className="shrink-0 text-xs font-medium tabular-nums">
                {formatTime(task.startTime)}
                {task.durationMinutes ? ` · ${formatDuration(task.durationMinutes)}` : null}
              </span>
            ) : null}
          </div>
        ) : null}

        <button
          type="button"
          onClick={onOpen}
          aria-label={`Edit ${task.title}`}
          disabled={readOnly}
          className={cn(
            'rounded-sm py-0.5 text-left text-[0.95rem] leading-snug font-semibold outline-none',
            'focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default',
            task.status === 'done' && 'line-through decoration-2',
          )}
        >
          {task.title}
        </button>

        {task.carriedOverCount > 0 ||
        task.source === 'calendar' ||
        task.jiraIssue ||
        overlaps.length ||
        repeatKind ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium">
            {task.carriedOverCount > 0 ? (
              <span className="inline-flex items-center gap-1">
                <RepeatIcon aria-hidden="true" className="size-3.5" />
                {carriedOverLabel(task.carriedOverCount)}
              </span>
            ) : null}
            {repeatKind ? (
              <span className="inline-flex items-center gap-1">
                <IterationCwIcon aria-hidden="true" className="size-3.5" />
                {REPEAT_MARKER[repeatKind]}
              </span>
            ) : null}
            {task.source === 'calendar' ? (
              <span className="inline-flex items-center gap-1">
                <CalendarIcon aria-hidden="true" className="size-3.5" />
                From Google Calendar
              </span>
            ) : null}
            {overlaps.length ? (
              <span className="inline-flex items-center gap-1">
                <TriangleAlertIcon aria-hidden="true" className="size-3.5" />
                {overlapMarkerLabel(overlaps)}
              </span>
            ) : null}
            {task.jiraIssue ? <span className="font-mono">{task.jiraIssue.key}</span> : null}
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between px-1 pb-1">
        <StatusToggle status={task.status} onCycle={onCycleStatus} disabled={readOnly} />
        <div className="flex items-center">
          {menu}
          {dragHandle}
        </div>
      </div>
    </article>
  )
})
