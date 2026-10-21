import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { startSeries } from '@/services/db/seriesRepository'
import { createTask } from '@/services/db/taskRepository'
import { resetDatabase } from '@/test/resetDatabase'
import { useSeries } from './useSeries'

describe('useSeries', () => {
  beforeEach(resetDatabase)

  it('is loading, not "no series", right after the id changes', async () => {
    const task = await createTask({ title: 'Standup', dayKey: '2026-10-21', block: 'morning' })
    const series = await startSeries(task.id, { kind: 'daily' })
    const { result, rerender } = renderHook(({ id }) => useSeries(id), {
      initialProps: { id: null as string | null },
    })
    await waitFor(() => expect(result.current).toBeNull())

    rerender({ id: series.id })
    // The previous result (null) must not show for the new id: the editor would read "Doesn't repeat".
    expect(result.current).toBeUndefined()
    await waitFor(() => expect(result.current?.id).toBe(series.id))
  })
})
