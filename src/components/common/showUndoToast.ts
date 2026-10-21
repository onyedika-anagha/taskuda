import { createElement } from 'react'
import { toast } from 'sonner'
import { UndoToast } from './UndoToast'

/** Undo toast (PRD FR18). `Infinity`: UndoToast closes itself when its own (pausable) timer runs out. */
export function showUndoToast(message: string, onUndo: () => void): void {
  toast.custom((id) => createElement(UndoToast, { toastId: id, message, onUndo }), {
    duration: Infinity,
  })
}
