import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'
import { setViewportTabletUp } from './viewport'

// jsdom gaps that Radix UI and our hooks rely on.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver
Element.prototype.scrollIntoView ??= vi.fn<() => void>()
Element.prototype.hasPointerCapture ??= () => false
Element.prototype.releasePointerCapture ??= vi.fn<(pointerId: number) => void>()
Element.prototype.setPointerCapture ??= vi.fn<(pointerId: number) => void>()

setViewportTabletUp(true)

afterEach(() => {
  cleanup()
  setViewportTabletUp(true)
})
