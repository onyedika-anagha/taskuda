import {
  DndContext,
  closestCorners,
  pointerWithin,
  type CollisionDetection,
  type UniqueIdentifier,
} from '@dnd-kit/core'
import { screenReaderInstructions, useCanvasDragAndDrop } from '@/hooks/useCanvasDragAndDrop'
import { TABLET_UP, useMediaQuery } from '@/hooks/useMediaQuery'
import type { Company } from '@/types/company'
import type { Task, TimeBlock } from '@/types/task'
import { TIME_BLOCKS } from '@/types/task'
import { TimeBlockColumn } from './TimeBlockColumn'
import { TimeBlockTabs } from './TimeBlockTabs'

const isTab = (id: UniqueIdentifier) => String(id).startsWith('tab:')
const isColumn = (id: UniqueIdentifier) => String(id).startsWith('block:')

/**
 * Notes win over their column, so dropping between or onto notes reorders them.
 * Columns only count when empty, and mobile tabs only under the pointer.
 */
const detectCollisions: CollisionDetection = (args) => {
  const underPointer = pointerWithin(args)
  const tab = underPointer.find((c) => isTab(c.id))
  if (tab) return [tab]
  const notes = underPointer.filter((c) => !isColumn(c.id) && !isTab(c.id))
  if (notes.length > 0) return notes

  const candidates = args.droppableContainers.filter(
    (c) => !isTab(c.id) && !(isColumn(c.id) && c.data.current?.empty === false),
  )
  return closestCorners({ ...args, droppableContainers: candidates })
}

interface TaskCanvasProps {
  tasks: Task[]
  companiesById: Map<string, Company>
  readOnly: boolean
  onAdd: (block: TimeBlock) => void
}

/** S2 canvas: three columns on tablet and up, tabs on phones, with drag-and-drop across blocks. */
export function TaskCanvas({ tasks, companiesById, readOnly, onAdd }: TaskCanvasProps) {
  const isTabletUp = useMediaQuery(TABLET_UP)
  const dnd = useCanvasDragAndDrop(tasks)

  const renderBlock = (block: TimeBlock, showHeader = true) => (
    <TimeBlockColumn
      key={block}
      block={block}
      taskIds={dnd.layout[block]}
      tasksById={dnd.tasksById}
      companiesById={companiesById}
      readOnly={readOnly}
      showHeader={showHeader}
      onAdd={onAdd}
    />
  )

  return (
    <DndContext
      sensors={dnd.sensors}
      collisionDetection={detectCollisions}
      accessibility={{ announcements: dnd.announcements, screenReaderInstructions }}
      onDragStart={dnd.onDragStart}
      onDragOver={dnd.onDragOver}
      onDragEnd={(event) => void dnd.onDragEnd(event)}
      onDragCancel={dnd.onDragCancel}
    >
      {isTabletUp ? (
        <div className="grid grid-cols-3 gap-4 lg:gap-6">
          {TIME_BLOCKS.map((block) => renderBlock(block))}
        </div>
      ) : (
        <TimeBlockTabs layout={dnd.layout} renderBlock={(block) => renderBlock(block, false)} />
      )}
    </DndContext>
  )
}
