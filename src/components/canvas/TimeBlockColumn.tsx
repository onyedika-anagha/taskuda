import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { SortableStickyNote } from '@/components/task/SortableStickyNote'
import { columnDropId } from '@/hooks/useCanvasDragAndDrop'
import { cn } from '@/lib/utils'
import type { Company } from '@/types/company'
import type { Task, TimeBlock } from '@/types/task'
import { BLOCK_LABELS } from '@/utils/taskPresentation'
import { EmptyBlockState } from './EmptyBlockState'

interface TimeBlockColumnProps {
  block: TimeBlock
  taskIds: string[]
  tasksById: Map<string, Task>
  companiesById: Map<string, Company>
  readOnly: boolean
  /** Mobile tabs already show the block name. */
  showHeader?: boolean
  onAdd: (block: TimeBlock) => void
}

/** One time block: header, sortable notes, and an empty state that still accepts drops. */
export function TimeBlockColumn({
  block,
  taskIds,
  tasksById,
  companiesById,
  readOnly,
  showHeader = true,
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
      </h2>
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
