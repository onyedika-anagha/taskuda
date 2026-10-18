import { afterEach, describe, expect, it, vi } from 'vitest'
import { db } from './database'
import { checkStorageAvailable } from './storageCheck'

describe('checkStorageAvailable', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns true when the database opens', async () => {
    expect(await checkStorageAvailable()).toBe(true)
  })

  it('returns false when opening the database fails', async () => {
    vi.spyOn(db, 'open').mockRejectedValue(new Error('blocked'))
    expect(await checkStorageAvailable()).toBe(false)
  })
})
