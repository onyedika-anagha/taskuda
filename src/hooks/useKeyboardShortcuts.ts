import { useEffect, useRef } from 'react'

export type ShortcutMap = Partial<Record<string, () => void>>

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.isContentEditable ||
    ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
    target.getAttribute('role') === 'combobox'
  )
}

/**
 * Single-key shortcuts (`N`, `T`, `[`, `]`, `?`). Ignored while typing, with modifier keys,
 * or while a dialog is open, so they never fire by accident.
 */
export function useKeyboardShortcuts(shortcuts: ShortcutMap): void {
  const latest = useRef(shortcuts)
  useEffect(() => {
    latest.current = shortcuts
  })

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return
      if (isTyping(event.target)) return
      if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return
      const handler = latest.current[event.key.length === 1 ? event.key.toLowerCase() : event.key]
      if (!handler) return
      event.preventDefault()
      handler()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
