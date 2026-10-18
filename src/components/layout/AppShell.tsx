import { useEffect, type ReactNode } from 'react'
import { useAppStatusStore } from '@/stores/appStatusStore'
import { OfflineBanner } from './OfflineBanner'

interface AppShellProps {
  appBar: ReactNode
  children: ReactNode
}

export function AppShell({ appBar, children }: AppShellProps) {
  const checkStorage = useAppStatusStore((s) => s.checkStorage)

  useEffect(() => {
    void checkStorage()
  }, [checkStorage])

  return (
    <div className="flex min-h-dvh flex-col">
      {appBar}
      <OfflineBanner />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 pt-4 pb-28 md:pb-8">
        {children}
      </main>
    </div>
  )
}
