import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as storageCheck from '@/services/db/storageCheck'
import { useAppStatusStore } from './appStatusStore'

describe('appStatusStore', () => {
  beforeEach(() => {
    useAppStatusStore.setState({ storageStatus: 'checking' })
    vi.restoreAllMocks()
  })

  it('reports storage as available when the database opens', async () => {
    await useAppStatusStore.getState().checkStorage()
    expect(useAppStatusStore.getState().storageStatus).toBe('available')
  })

  it('reports storage as unavailable when the browser blocks it (S2 error state)', async () => {
    vi.spyOn(storageCheck, 'checkStorageAvailable').mockResolvedValue(false)
    await useAppStatusStore.getState().checkStorage()
    expect(useAppStatusStore.getState().storageStatus).toBe('unavailable')
  })
})
