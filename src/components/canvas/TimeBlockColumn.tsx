import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { SortableStickyNote } from '@/components/task/SortableStickyNote'
import { columnDropId } from '@/hooks/useCanvasDragAndDrop'
import { cn } from '@/lib/utils'
import type { Company } from '@/types/company'
import type { RecurringSeries } from '@/types/recurring'
import type { RiskKind } from '@/types/risk'
import type { Task, TimeBlock } from '@/types/task'
import { repeatKindFor } from '@/utils/recurrence'
import { BLOCK_LABELS } from '@/utils/taskPresentation'
import { BlockTimeLeft } from './BlockTimeLeft'
import { EmptyBlockState } from './EmptyBlockState'

interface TimeBlockColumnProps {
  block: TimeBlock
  taskIds: string[]
  tasksById: Map<string, Task>
  companiesById: Map<string, Company>
  readOnly: boolean
  /** Task id → the tasks it overlaps (PRD FR25). */
  overlapsById: Map<string, Task[]>
  seriesById: ReadonlyMap<string, RecurringSeries>
  /** Task id → its at-risk marker (PRD FR31). */
  risksById: ReadonlyMap<string, RiskKind>
  today: string
  /** Mobile tabs already show the block name. */
  showHeader?: boolean
  /** Set on today's current block only (PRD FR27). */
  minutesLeft?: number | null
  onAdd: (block: TimeBlock) => void
}

/** One time block: header, sortable notes, and an empty state that still accepts drops. */
export function TimeBlockColumn({
  block,
  taskIds,
  tasksById,
  companiesById,
  readOnly,
  overlapsById,
  seriesById,
  risksById,
  today,
  showHeader = true,
  minutesLeft = null,
  onAdd,
}: TimeBlockColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: columnDropId(block),
    disabled: readOnly,
    data: { empty: taskIds.length === 0 },
  })
  const headingId = `block-${block}-heading`

  return (
    <section aria-labelledby={headingId} className="flex min-w-0 flex-col gap-3">
      <h2
        id={headingId}
        className={cn('flex items-baseline gap-2 text-base font-semibold', !showHeader && 'sr-only')}
      >
        {BLOCK_LABELS[block]}
        <span className="text-sm font-normal text-muted-foreground tabular-nums">{taskIds.length}</span>
        {minutesLeft !== null ? <BlockTimeLeft minutesLeft={minutesLeft} className="ml-auto" /> : null}
      </h2>
      {/* Phones: the heading is hidden (the tab names the block), so show the time under the tabs. */}
      {!showHeader && minutesLeft !== null ? (
        <p aria-hidden="true" className="-mb-1">
          <BlockTimeLeft minutesLeft={minutesLeft} />
        </p>
      ) : null}
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <ul
          ref={setNodeRef}
          className={cn('flex min-h-28 flex-col gap-3 rounded-xl transition-colors', isOver && 'bg-muted/60')}
        >
          {taskIds.map((id, index) => {
            const task = tasksById.get(id)
            if (!task) return null
            return (
              <SortableStickyNote
                key={id}
                task={task}
                company={task.companyId ? companiesById.get(task.companyId) : undefined}
                index={index}
                blockSize={taskIds.length}
                readOnly={readOnly}
                overlaps={overlapsById.get(id)}
                repeatKind={repeatKindFor(task, seriesById)}
                risk={risksById.get(id)}
                today={today}
              />
            )
          })}
          {taskIds.length === 0 ? (
            <li>
              <EmptyBlockState block={block} onAdd={readOnly ? undefined : () => onAdd(block)} />
            </li>
          ) : null}
        </ul>
      </SortableContext>
    </section>
  )
}
