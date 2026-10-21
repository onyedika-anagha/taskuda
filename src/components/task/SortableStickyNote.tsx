import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVerticalIcon } from 'lucide-react'
import { useTaskActions } from '@/hooks/useTaskActions'
import { useCanvasUiStore } from '@/stores/canvasUiStore'
import type { Company } from '@/types/company'
import type { RepeatKind } from '@/types/recurring'
import type { RiskKind } from '@/types/risk'
import type { Task } from '@/types/task'
import { StickyNote } from './StickyNote'
import { TaskMenu } from './TaskMenu'

interface SortableStickyNoteProps {
  task: Task
  company: Company | undefined
  index: number
  blockSize: number
  readOnly: boolean
  overlaps?: Task[]
  repeatKind?: RepeatKind | null
  risk?: RiskKind | null
  today?: string
}

/** A sticky note wired to drag-and-drop, its menu and task actions. */
export function SortableStickyNote({
  task,
  company,
  index,
  blockSize,
  readOnly,
  overlaps,
  repeatKind,
  risk,
  today,
}: SortableStickyNoteProps) {
  const actions = useTaskActions()
  const openEdit = useCanvasUiStore((s) => s.openEdit)
  const requestDelete = useCanvasUiStore((s) => s.requestDelete)
  const menuOpen = useCanvasUiStore((s) => s.menuTaskId === task.id)
  const setMenuTaskId = useCanvasUiStore((s) => s.setMenuTaskId)

  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id, data: { block: task.block }, disabled: readOnly })

  return (
    <li>
      <StickyNote
        ref={setNodeRef}
        task={task}
        company={company}
        readOnly={readOnly}
        overlaps={overlaps}
        repeatKind={repeatKind}
        risk={risk}
        today={today}
        isDragging={isDragging}
        style={{ transform: CSS.Translate.toString(transform), transition }}
        onOpen={() => openEdit(task.id)}
        onCycleStatus={() => void actions.cycleStatus(task)}
        menu={
          readOnly ? null : (
            <TaskMenu
              task={task}
              open={menuOpen}
              onOpenChange={(open) => setMenuTaskId(open ? task.id : null)}
              canMoveUp={index > 0}
              canMoveDown={index < blockSize - 1}
              onEdit={() => openEdit(task.id)}
              onSetStatus={(status) => void actions.setStatus(task, status)}
              onMoveToBlock={(block) =>
                void actions.moveTask(task, block, Number.MAX_SAFE_INTEGER, { viaMenu: true })
              }
              onMoveUp={() => void actions.moveTask(task, task.block, index - 1, { viaMenu: true })}
              onMoveDown={() => void actions.moveTask(task, task.block, index + 1, { viaMenu: true })}
              onDelete={() => requestDelete(task.id)}
            />
          )
        }
        dragHandle={
          readOnly ? null : (
            <button
              ref={setActivatorNodeRef}
              type="button"
              {...attributes}
              {...listeners}
              aria-label={`Drag ${task.title}`}
              className="grid size-11 cursor-grab touch-none place-items-center rounded-md outline-none hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing dark:hover:bg-white/10"
            >
              <GripVerticalIcon aria-hidden="true" className="size-4" />
            </button>
          )
        }
      />
    </li>
  )
}
