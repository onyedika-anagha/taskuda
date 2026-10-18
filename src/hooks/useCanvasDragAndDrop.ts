import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragOverEvent,
  type ScreenReaderInstructions,
  type UniqueIdentifier,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { Task, TimeBlock } from '@/types/task'
import { TIME_BLOCKS } from '@/types/task'
import { layoutFromTasks, moveInLayout, positionOf, type BlockLayout } from '@/utils/blockLayout'
import { BLOCK_LABELS } from '@/utils/taskPresentation'
import { useTaskActions } from './useTaskActions'

/** Droppable ids for block columns (`block:morning`) and mobile tabs (`tab:morning`). */
export const columnDropId = (block: TimeBlock) => `block:${block}`
export const tabDropId = (block: TimeBlock) => `tab:${block}`

function blockFromDropId(id: UniqueIdentifier, prefix: 'block:' | 'tab:'): TimeBlock | undefined {
  const value = String(id)
  if (!value.startsWith(prefix)) return undefined
  const block = value.slice(prefix.length) as TimeBlock
  return TIME_BLOCKS.includes(block) ? block : undefined
}

export const screenReaderInstructions: ScreenReaderInstructions = {
  draggable:
    'To pick up a task, press Space or Enter. Use the arrow keys to move it, then press Space or Enter to drop it, or Escape to cancel.',
}

export function useCanvasDragAndDrop(tasks: Task[]) {
  const actions = useTaskActions()
  const [layout, setLayout] = useState<BlockLayout>(() => layoutFromTasks(tasks))
  // Event handlers and announcements read the latest layout through this ref.
  const layoutRef = useRef(layout)
  useLayoutEffect(() => {
    layoutRef.current = layout
  }, [layout])
  const draggingRef = useRef(false)
  // Until the note leaves its starting slot, "over itself" repeats the pick-up announcement; skip it.
  const leftStartRef = useRef(false)

  const tasksById = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks])

  // Stored data is the source of truth; resync whenever it changes and nothing is being dragged.
  useEffect(() => {
    if (!draggingRef.current) setLayout(layoutFromTasks(tasks))
  }, [tasks])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  /** Where the dragged note would land: over a note takes that note's place; over a column goes last. */
  function describePosition(activeId: UniqueIdentifier, overId: UniqueIdentifier = activeId): string {
    const current = layoutRef.current
    const column = blockFromDropId(overId, 'block:')
    if (column) {
      const size = current[column].filter((id) => id !== String(activeId)).length + 1
      return `${BLOCK_LABELS[column]}, position ${size} of ${size}`
    }
    const position = positionOf(current, String(overId))
    if (!position) return ''
    return `${BLOCK_LABELS[position.block]}, position ${position.index + 1} of ${current[position.block].length}`
  }

  const titleOf = (id: UniqueIdentifier) => tasksById.get(String(id))?.title ?? 'Task'

  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${titleOf(active.id)}. ${describePosition(active.id)}.`,
    onDragOver: ({ active, over }) => {
      if (over?.id === active.id && !leftStartRef.current) return undefined
      leftStartRef.current = true
      if (!over) return `${titleOf(active.id)} is no longer over a block.`
      const tabBlock = blockFromDropId(over.id, 'tab:')
      if (tabBlock) return `${titleOf(active.id)} is over ${BLOCK_LABELS[tabBlock]}.`
      return `${titleOf(active.id)}: ${describePosition(active.id, over.id)}.`
    },
    onDragEnd: ({ active, over }) =>
      over
        ? `Dropped ${titleOf(active.id)}. ${describePosition(active.id, over.id)}.`
        : `Dropped ${titleOf(active.id)}.`,
    onDragCancel: ({ active }) => `Cancelled. ${titleOf(active.id)} went back to where it was.`,
  }

  function onDragStart() {
    draggingRef.current = true
    leftStartRef.current = false
  }

  /** Moves the dragged note into another column while dragging, so the drop position previews. */
  function onDragOver({ active, over }: DragOverEvent) {
    if (!over) return
    const activeTaskId = String(active.id)
    const current = positionOf(layoutRef.current, activeTaskId)
    if (!current) return
    const overColumn = blockFromDropId(over.id, 'block:')
    const overTask = positionOf(layoutRef.current, String(over.id))
    const targetBlock = overColumn ?? overTask?.block
    if (!targetBlock || targetBlock === current.block) return
    const index = overTask ? overTask.index : layoutRef.current[targetBlock].length
    setLayout(moveInLayout(layoutRef.current, activeTaskId, targetBlock, index))
  }

  async function onDragEnd({ active, over }: DragEndEvent) {
    const taskId = String(active.id)
    const task = tasksById.get(taskId)
    draggingRef.current = false
    if (!task || !over) {
      setLayout(layoutFromTasks(tasks))
      return
    }

    let target: { block: TimeBlock; index: number } | undefined
    const tabBlock = blockFromDropId(over.id, 'tab:')
    if (tabBlock) {
      target = { block: tabBlock, index: Number.MAX_SAFE_INTEGER }
    } else {
      const current = positionOf(layoutRef.current, taskId)
      const overTask = positionOf(layoutRef.current, String(over.id))
      if (current && overTask && overTask.block === current.block) {
        target = { block: current.block, index: overTask.index }
      } else {
        target = current
      }
    }

    const original = layoutFromTasks(tasks)
    const originalIndex = original[task.block].indexOf(taskId)
    if (!target || (target.block === task.block && target.index === originalIndex)) {
      setLayout(original)
      return
    }
    // Keep the dropped position on screen until the saved order arrives from the database.
    setLayout(moveInLayout(original, taskId, target.block, target.index))
    const moved = await actions.moveTask(task, target.block, target.index)
    if (!moved) setLayout(layoutFromTasks(tasks))
  }

  function onDragCancel() {
    draggingRef.current = false
    setLayout(layoutFromTasks(tasks))
  }

  return { layout, tasksById, sensors, announcements, onDragStart, onDragOver, onDragEnd, onDragCancel }
}
