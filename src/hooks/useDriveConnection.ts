import { useState } from 'react'
import { toast } from 'sonner'
import { GoogleAuthError } from '@/services/google/googleAuth'
import { useBackupStore } from '@/stores/backupStore'

function connectErrorMessage(error: unknown): string {
  if (error instanceof GoogleAuthError) {
    if (error.kind === 'popup-closed' || error.kind === 'denied') {
      return 'Google sign-in was cancelled. You can connect later in Settings.'
    }
    if (error.kind === 'interaction-required')
      return 'Your browser blocked the Google sign-in window. Allow pop-ups and try again.'
    if (error.kind === 'missing-scope')
      return 'Taskuda needs permission to keep its backup file in your Drive.'
    if (error.kind === 'not-configured') return 'Google sign-in isn’t set up for this copy of Taskuda.'
    if (error.kind === 'script-failed') return 'Couldn’t reach Google. Check your connection and try again.'
  }
  return 'Couldn’t connect to Google Drive. Try again.'
}

/** Connect / disconnect Drive from a click (design F7.1). */
export function useDriveConnection() {
  const connect = useBackupStore((s) => s.connect)
  const disconnect = useBackupStore((s) => s.disconnect)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return {
    connecting,
    error,
    async connect() {
      setConnecting(true)
      setError(null)
      try {
        await connect()
        toast.success('Google Drive connected')
      } catch (cause) {
        setError(connectErrorMessage(cause))
      } finally {
        setConnecting(false)
      }
    },
    async disconnect() {
      await disconnect()
      toast.success('Google Drive disconnected. Your data stays on this device.')
    },
  }
}
