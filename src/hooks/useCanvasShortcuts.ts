import { useCanvasUiStore } from '@/stores/canvasUiStore'
import type { DayNavigation } from './useDayNavigation'
import { useKeyboardShortcuts } from './useKeyboardShortcuts'

/** S2 shortcuts: `N` new task, `T` today, `[` / `]` previous / next day, `M` note menu, `?` shortcut list. */
export function useCanvasShortcuts(nav: DayNavigation, readOnly: boolean): void {
  const openCreate = useCanvasUiStore((s) => s.openCreate)
  const setShortcutsOpen = useCanvasUiStore((s) => s.setShortcutsOpen)
  const setMenuTaskId = useCanvasUiStore((s) => s.setMenuTaskId)

  useKeyboardShortcuts({
    n: readOnly ? undefined : () => openCreate(),
    t: nav.goToToday,
    '[': nav.goToPrevious,
    ']': nav.goToNext,
    '?': () => setShortcutsOpen(true),
    // `M` opens the menu of the note that contains focus (design F3.2).
    m: readOnly
      ? undefined
      : () => {
          const note = document.activeElement?.closest<HTMLElement>('[data-task-id]')
          if (note?.dataset.taskId) setMenuTaskId(note.dataset.taskId)
        },
  })
}
