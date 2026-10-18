import type { Task, TimeBlock } from '@/types/task'
import { TIME_BLOCKS } from '@/types/task'

/** Task ids per block, in display order. Used as drag-and-drop state. */
export type BlockLayout = Record<TimeBlock, string[]>

export function emptyLayout(): BlockLayout {
  return { morning: [], afternoon: [], evening: [] }
}

/** Expects tasks already sorted by block and order (see `sortTasks`). */
export function layoutFromTasks(tasks: Task[]): BlockLayout {
  const layout = emptyLayout()
  for (const task of tasks) layout[task.block].push(task.id)
  return layout
}

export function findBlock(layout: BlockLayout, taskId: string): TimeBlock | undefined {
  return TIME_BLOCKS.find((block) => layout[block].includes(taskId))
}

/** Moves `taskId` to `index` in `toBlock`, returning a new layout. */
export function moveInLayout(
  layout: BlockLayout,
  taskId: string,
  toBlock: TimeBlock,
  index: number,
): BlockLayout {
  const next: BlockLayout = {
    morning: layout.morning.filter((id) => id !== taskId),
    afternoon: layout.afternoon.filter((id) => id !== taskId),
    evening: layout.evening.filter((id) => id !== taskId),
  }
  const clamped = Math.max(0, Math.min(index, next[toBlock].length))
  next[toBlock].splice(clamped, 0, taskId)
  return next
}

export function positionOf(
  layout: BlockLayout,
  taskId: string,
): { block: TimeBlock; index: number } | undefined {
  const block = findBlock(layout, taskId)
  return block ? { block, index: layout[block].indexOf(taskId) } : undefined
}
