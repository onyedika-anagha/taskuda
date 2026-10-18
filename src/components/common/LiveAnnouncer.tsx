import { useAnnouncerStore } from '@/stores/announcerStore'

/** Polite live region for status changes and moves (design spec Section 7). Render once in the app shell. */
export function LiveAnnouncer() {
  const message = useAnnouncerStore((s) => s.message)
  const nonce = useAnnouncerStore((s) => s.nonce)
  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      <span key={nonce}>{message}</span>
    </div>
  )
}
