import { CircleCheckIcon, CircleDotIcon, CircleIcon, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TaskStatus } from '@/types/task'
import { STATUS_LABELS, nextStatus } from '@/utils/taskStatus'

const STATUS_ICONS: Record<TaskStatus, LucideIcon> = {
  todo: CircleIcon,
  in_progress: CircleDotIcon,
  done: CircleCheckIcon,
}

interface StatusToggleProps {
  status: TaskStatus
  onCycle: () => void
  disabled?: boolean
}

/** One tap cycles To Do → In Progress → Done (PRD AC4.1, DAC2). Icon + label, never color alone. */
export function StatusToggle({ status, onCycle, disabled = false }: StatusToggleProps) {
  const Icon = STATUS_ICONS[status]
  return (
    <button
      type="button"
      onClick={onCycle}
      disabled={disabled}
      aria-label={`Status: ${STATUS_LABELS[status]}. Change to ${STATUS_LABELS[nextStatus(status)]}`}
      className={cn(
        'inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 text-xs font-semibold outline-none',
        'hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-ring dark:hover:bg-white/10',
        'disabled:cursor-default disabled:hover:bg-transparent',
      )}
    >
      <Icon aria-hidden="true" className="size-5" />
      <span>{STATUS_LABELS[status]}</span>
    </button>
  )
}
