import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { makeTask } from '@/test/factories'
import { useTaskRisks } from './useTaskRisks'

const TODAY = '2026-10-21'

describe('useTaskRisks', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] })
    vi.setSystemTime(new Date(2026, 9, 21, 10, 5))
  })
  afterEach(() => vi.useRealTimers())

  const tasks = [
    makeTask({ id: 'call', dayKey: TODAY, startTime: '10:00', durationMinutes: 60 }),
    makeTask({ id: 'done', dayKey: TODAY, status: 'done' }),
  ]

  it('counts progress and lists nothing at risk before the grace time', () => {
    const { result } = renderHook(() => useTaskRisks(tasks))
    expect(result.current).toMatchObject({ done: 1, total: 2, today: TODAY })
    expect(result.current.atRisk).toEqual([])
  })

  it('DAC23 a marker appears within a minute of its rule becoming true', () => {
    const { result } = renderHook(() => useTaskRisks(tasks))
    act(() => vi.advanceTimersByTime(5 * 60_000))
    expect(result.current.byId.get('call')).toBe('running_late')
  })

  it('DAC23 recomputes as soon as the tab is visible again', () => {
    const { result } = renderHook(() => useTaskRisks(tasks))
    vi.setSystemTime(new Date(2026, 9, 21, 11, 30))
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(result.current.byId.get('call')).toBe('overran')
  })
})
