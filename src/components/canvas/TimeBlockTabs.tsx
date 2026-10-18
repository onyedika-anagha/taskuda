import { useDroppable } from '@dnd-kit/core'
import { useState, type ReactNode } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { tabDropId } from '@/hooks/useCanvasDragAndDrop'
import { useSwipe } from '@/hooks/useSwipe'
import { cn } from '@/lib/utils'
import type { TimeBlock } from '@/types/task'
import { TIME_BLOCKS } from '@/types/task'
import type { BlockLayout } from '@/utils/blockLayout'
import { BLOCK_LABELS } from '@/utils/taskPresentation'
import { blockForDate } from '@/utils/timeBlocks'

function DroppableTab({ block, count }: { block: TimeBlock; count: number }) {
  // Dropping a note on a tab moves it to the end of that block (design spec Section 6).
  const { setNodeRef, isOver } = useDroppable({ id: tabDropId(block) })
  return (
    <TabsTrigger
      ref={setNodeRef}
      value={block}
      className={cn('min-h-11 gap-1.5', isOver && 'ring-2 ring-ring')}
    >
      {BLOCK_LABELS[block]}
      <span className="text-xs tabular-nums opacity-80">{count}</span>
    </TabsTrigger>
  )
}

interface TimeBlockTabsProps {
  layout: BlockLayout
  renderBlock: (block: TimeBlock) => ReactNode
}

/** Phones (< 768px): one block at a time, opening on the current one; swipe to switch. */
export function TimeBlockTabs({ layout, renderBlock }: TimeBlockTabsProps) {
  const [active, setActive] = useState<TimeBlock>(() => blockForDate(new Date()))
  const index = TIME_BLOCKS.indexOf(active)
  const swipe = useSwipe(
    () => setActive(TIME_BLOCKS[Math.min(index + 1, TIME_BLOCKS.length - 1)]),
    () => setActive(TIME_BLOCKS[Math.max(index - 1, 0)]),
  )

  return (
    <Tabs value={active} onValueChange={(v) => setActive(v as TimeBlock)}>
      <TabsList className="h-auto w-full">
        {TIME_BLOCKS.map((block) => (
          <DroppableTab key={block} block={block} count={layout[block].length} />
        ))}
      </TabsList>
      {TIME_BLOCKS.map((block) => (
        <TabsContent key={block} value={block} {...swipe}>
          {renderBlock(block)}
        </TabsContent>
      ))}
    </Tabs>
  )
}
