import { useState } from 'react'
import { toast } from 'sonner'
import { googleConnectErrorMessage } from '@/utils/googleErrorMessages'
import { useBackupStore } from '@/stores/backupStore'

/** Connect / disconnect Drive from a click (design F7.1). */
export function useDriveConnection() {
  const connect = useBackupStore((s) => s.connect)
  const disconnect = useBackupStore((s) => s.disconnect)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return {
    connecting,
    error,
    /** Resolves true once connected; on failure shows the reason and resolves false. */
    async connect(options?: { backupNow?: boolean }): Promise<boolean> {
      setConnecting(true)
      setError(null)
      try {
        await connect(options)
        toast.success('Google Drive connected')
        return true
      } catch (cause) {
        setError(googleConnectErrorMessage(cause, 'Google Drive'))
        return false
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
