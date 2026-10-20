import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { toast } from 'sonner'
import { UndoToast } from './UndoToast'

const UNDO_WINDOW_MS = 10_000

describe('UndoToast (PRD FR18)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(toast, 'dismiss')
  })
  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('AC18.1 closes itself after 10 seconds', () => {
    render(<UndoToast toastId="t" message="Task deleted" onUndo={() => {}} />)
    act(() => vi.advanceTimersByTime(UNDO_WINDOW_MS - 1))
    expect(toast.dismiss).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(1))
    expect(toast.dismiss).toHaveBeenCalledWith('t')
  })

  it('AC18.1 Undo calls back and closes the toast', () => {
    const onUndo = vi.fn<() => void>()
    render(<UndoToast toastId="t" message="Task deleted" onUndo={onUndo} />)
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }))
    expect(onUndo).toHaveBeenCalledOnce()
    expect(toast.dismiss).toHaveBeenCalledWith('t')
  })

  it('AC18.5 pauses while keyboard focus is inside, keeping the time already used', () => {
    render(<UndoToast toastId="t" message="Task deleted" onUndo={() => {}} />)
    act(() => vi.advanceTimersByTime(4_000))
    const undo = screen.getByRole('button', { name: 'Undo' })
    act(() => undo.focus())
    act(() => vi.advanceTimersByTime(60_000))
    expect(toast.dismiss).not.toHaveBeenCalled()
    act(() => undo.blur())
    act(() => vi.advanceTimersByTime(UNDO_WINDOW_MS - 4_000))
    expect(toast.dismiss).toHaveBeenCalledWith('t')
  })

  it('pauses while the pointer is over it', () => {
    render(<UndoToast toastId="t" message="Task deleted" onUndo={() => {}} />)
    const text = screen.getByText('Task deleted')
    fireEvent.mouseEnter(text.parentElement as HTMLElement)
    act(() => vi.advanceTimersByTime(60_000))
    expect(toast.dismiss).not.toHaveBeenCalled()
    fireEvent.mouseLeave(text.parentElement as HTMLElement)
    act(() => vi.advanceTimersByTime(UNDO_WINDOW_MS))
    expect(toast.dismiss).toHaveBeenCalledWith('t')
  })
})
