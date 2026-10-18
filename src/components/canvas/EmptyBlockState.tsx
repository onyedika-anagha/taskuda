import type { TimeBlock } from '@/types/task'
import { EMPTY_BLOCK_MESSAGES } from '@/utils/taskPresentation'

interface EmptyBlockStateProps {
  block: TimeBlock
  /** Omitted on read-only days. */
  onAdd?: () => void
}

export function EmptyBlockState({ block, onAdd }: EmptyBlockStateProps) {
  return (
    <div className="flex min-h-28 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
      <p>{EMPTY_BLOCK_MESSAGES[block]}</p>
      {onAdd ? (
        <button
          type="button"
          onClick={onAdd}
          className="min-h-11 rounded-md px-2 font-medium text-foreground underline underline-offset-4 outline-none hover:no-underline focus-visible:ring-2 focus-visible:ring-ring"
        >
          Add a task
        </button>
      ) : null}
    </div>
  )
}
