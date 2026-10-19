import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'
import { cleanup, configure } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'
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

// PBKDF2 (600k iterations) competes for CPU when test files run in parallel; give findBy* room.
configure({ asyncUtilTimeout: 4000 })

setViewportTabletUp(true)

// Tests start past the first-run welcome unless they clear this (see WelcomePage tests).
beforeEach(() => {
  window.localStorage.setItem('taskuda.welcomeDone', '1')
})

afterEach(() => {
  cleanup()
  setViewportTabletUp(true)
})
