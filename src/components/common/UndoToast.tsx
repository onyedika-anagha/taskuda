import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { usePausableTimeout } from '@/hooks/usePausableTimeout'

const UNDO_WINDOW_MS = 10_000

interface UndoToastProps {
  toastId: string | number
  message: string
  onUndo: () => void
  durationMs?: number
}

/**
 * A toast with an Undo button (PRD FR18). It runs its own timer because Sonner only pauses on hover:
 * here the countdown also pauses while keyboard focus is inside (design spec Section 7).
 */
export function UndoToast({ toastId, message, onUndo, durationMs = UNDO_WINDOW_MS }: UndoToastProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  usePausableTimeout(durationMs, hovered || focused, () => toast.dismiss(toastId))

  // Sonner makes the toast itself a tab stop (Alt+T, then Tab), so watch focus on the whole toast.
  useEffect(() => {
    const host = ref.current?.closest<HTMLElement>('[data-sonner-toast]') ?? ref.current
    if (!host) return
    const onFocusIn = () => setFocused(true)
    const onFocusOut = (event: FocusEvent) => {
      if (!host.contains(event.relatedTarget as Node | null)) setFocused(false)
    }
    host.addEventListener('focusin', onFocusIn)
    host.addEventListener('focusout', onFocusOut)
    return () => {
      host.removeEventListener('focusin', onFocusIn)
      host.removeEventListener('focusout', onFocusOut)
    }
  }, [])

  return (
    <div
      ref={ref}
      className="flex w-full items-center gap-3 rounded-(--radius) border bg-popover p-4 text-sm text-popover-foreground shadow-lg sm:w-(--width)"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span className="flex-1">{message}</span>
      <Button
        size="sm"
        variant="outline"
        className="min-h-11 min-w-11"
        onClick={() => {
          toast.dismiss(toastId)
          onUndo()
        }}
      >
        Undo
      </Button>
    </div>
  )
}
