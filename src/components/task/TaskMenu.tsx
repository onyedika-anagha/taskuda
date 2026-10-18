import { MoreHorizontalIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Task, TaskStatus, TimeBlock } from '@/types/task'
import { TASK_STATUSES, TIME_BLOCKS } from '@/types/task'
import { BLOCK_LABELS } from '@/utils/taskPresentation'
import { STATUS_LABELS } from '@/utils/taskStatus'

interface TaskMenuProps {
  task: Task
  open: boolean
  onOpenChange: (open: boolean) => void
  canMoveUp: boolean
  canMoveDown: boolean
  onEdit: () => void
  onSetStatus: (status: TaskStatus) => void
  onMoveToBlock: (block: TimeBlock) => void
  onMoveUp: () => void
  onMoveDown: () => void
  onDelete: () => void
}

/** Note menu: the non-drag way to do everything (design F3.2, NFR8). */
export function TaskMenu({
  task,
  open,
  onOpenChange,
  canMoveUp,
  canMoveDown,
  onEdit,
  onSetStatus,
  onMoveToBlock,
  onMoveUp,
  onMoveDown,
  onDelete,
}: TaskMenuProps) {
  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-11 text-inherit hover:bg-black/5 dark:hover:bg-white/10"
          aria-label={`Options for ${task.title}`}
        >
          <MoreHorizontalIcon aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onSelect={onEdit}>Edit</DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Set status</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup value={task.status} onValueChange={(v) => onSetStatus(v as TaskStatus)}>
              {TASK_STATUSES.map((status) => (
                <DropdownMenuRadioItem key={status} value={status}>
                  {STATUS_LABELS[status]}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        {TIME_BLOCKS.filter((block) => block !== task.block).map((block) => (
          <DropdownMenuItem key={block} onSelect={() => onMoveToBlock(block)}>
            Move to {BLOCK_LABELS[block]}
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem disabled={!canMoveUp} onSelect={onMoveUp}>
          Move up
        </DropdownMenuItem>
        <DropdownMenuItem disabled={!canMoveDown} onSelect={onMoveDown}>
          Move down
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={onDelete}>
          Delete task
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
