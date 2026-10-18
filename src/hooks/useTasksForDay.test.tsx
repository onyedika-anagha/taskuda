import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { createTask, setTaskStatus } from '@/services/db/taskRepository'
import { resetDatabase } from '@/test/resetDatabase'
import { useTasksForDay } from './useTasksForDay'

describe('useTasksForDay', () => {
  beforeEach(resetDatabase)

  it('returns the day’s tasks and updates when they change', async () => {
    const task = await createTask({ title: 'A', dayKey: '2026-10-19', block: 'morning' })
    await createTask({ title: 'Other day', dayKey: '2026-10-20', block: 'morning' })

    const { result } = renderHook(() => useTasksForDay('2026-10-19'))
    await waitFor(() => expect(result.current?.map((t) => t.title)).toEqual(['A']))

    await setTaskStatus(task.id, 'done')
    await waitFor(() => expect(result.current?.[0].status).toBe('done'))
  })
})
