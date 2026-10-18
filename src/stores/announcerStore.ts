import { create } from 'zustand'

interface AnnouncerState {
  message: string
  /** Changes on every announcement so repeating the same text is still read out. */
  nonce: number
  announce: (message: string) => void
}

/** Polite screen-reader announcements (status changes, moves). Rendered by `LiveAnnouncer`. */
export const useAnnouncerStore = create<AnnouncerState>((set) => ({
  message: '',
  nonce: 0,
  announce: (message) => set((state) => ({ message, nonce: state.nonce + 1 })),
}))

export function announce(message: string): void {
  useAnnouncerStore.getState().announce(message)
}
