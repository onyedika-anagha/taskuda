import { create } from 'zustand'
import type { TimeBlock } from '@/types/task'
import { blockForDate } from '@/utils/timeBlocks'

export type TaskEditorState =
  { mode: 'closed' } | { mode: 'create'; defaultBlock: TimeBlock } | { mode: 'edit'; taskId: string }

/** A move waiting on the "Remove time and move?" confirmation (design D2). */
export interface PendingTimedMove {
  taskId: string
  toBlock: TimeBlock
  toIndex: number
}

interface CanvasUiState {
  editor: TaskEditorState
  deleteTaskId: string | null
  pendingTimedMove: PendingTimedMove | null
  shortcutsOpen: boolean
  /** Note whose menu is open (opened by click or the `M` shortcut). */
  menuTaskId: string | null
  openCreate: (defaultBlock?: TimeBlock) => void
  openEdit: (taskId: string) => void
  closeEditor: () => void
  requestDelete: (taskId: string) => void
  cancelDelete: () => void
  requestTimedMove: (move: PendingTimedMove) => void
  clearTimedMove: () => void
  setShortcutsOpen: (open: boolean) => void
  setMenuTaskId: (taskId: string | null) => void
}

export const useCanvasUiStore = create<CanvasUiState>((set) => ({
  editor: { mode: 'closed' },
  deleteTaskId: null,
  pendingTimedMove: null,
  shortcutsOpen: false,
  menuTaskId: null,
  // Without a block, the one for the current time (design F2.1).
  openCreate: (defaultBlock) =>
    set({ editor: { mode: 'create', defaultBlock: defaultBlock ?? blockForDate(new Date()) } }),
  openEdit: (taskId) => set({ editor: { mode: 'edit', taskId } }),
  closeEditor: () => set({ editor: { mode: 'closed' } }),
  requestDelete: (taskId) => set({ deleteTaskId: taskId }),
  cancelDelete: () => set({ deleteTaskId: null }),
  requestTimedMove: (move) => set({ pendingTimedMove: move }),
  clearTimedMove: () => set({ pendingTimedMove: null }),
  setShortcutsOpen: (open) => set({ shortcutsOpen: open }),
  setMenuTaskId: (taskId) => set({ menuTaskId: taskId }),
}))
