import { create } from 'zustand'
import { checkStorageAvailable } from '@/services/db/storageCheck'

export type StorageStatus = 'checking' | 'available' | 'unavailable'

interface AppStatusState {
  /** `unavailable` drives the S2 storage-error state; editing is disabled. */
  storageStatus: StorageStatus
  checkStorage: () => Promise<void>
}

export const useAppStatusStore = create<AppStatusState>((set) => ({
  storageStatus: 'checking',
  checkStorage: async () => {
    const available = await checkStorageAvailable()
    set({ storageStatus: available ? 'available' : 'unavailable' })
  },
}))
