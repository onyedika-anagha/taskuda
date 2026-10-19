import type { ReactNode } from 'react'
import { ThemeProvider } from 'next-themes'
import { BackupScheduler } from '@/components/backup/BackupScheduler'
import { CalendarSyncScheduler } from '@/components/calendar/CalendarSyncScheduler'
import { LiveAnnouncer } from '@/components/common/LiveAnnouncer'
import { VaultPrompts } from '@/components/security/VaultPrompts'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <TooltipProvider>
        {children}
        {/* Top, so toasts never cover the phone bottom action bar. */}
        <Toaster position="top-center" />
        <LiveAnnouncer />
        <VaultPrompts />
        <BackupScheduler />
        <CalendarSyncScheduler />
      </TooltipProvider>
    </ThemeProvider>
  )
}
