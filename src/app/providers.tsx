import type { ReactNode } from 'react'
import { ThemeProvider } from 'next-themes'
import { BackupScheduler } from '@/components/backup/BackupScheduler'
import { CalendarSyncScheduler } from '@/components/calendar/CalendarSyncScheduler'
import { LiveAnnouncer } from '@/components/common/LiveAnnouncer'
import { ReminderScheduler } from '@/components/reminders/ReminderScheduler'
import { VaultPrompts } from '@/components/security/VaultPrompts'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

/** Just under the app bar (44px buttons + 8px padding + border), including the phone's notch. */
const TOAST_OFFSET = { top: 'calc(env(safe-area-inset-top, 0px) + 60px)' }

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <TooltipProvider>
        {children}
        {/* Top, so toasts never cover the phone bottom action bar; below the app bar, so they
            never cover the day navigator either. */}
        <Toaster position="top-center" offset={TOAST_OFFSET} mobileOffset={TOAST_OFFSET} />
        <LiveAnnouncer />
        <VaultPrompts />
        <BackupScheduler />
        <CalendarSyncScheduler />
        <ReminderScheduler />
      </TooltipProvider>
    </ThemeProvider>
  )
}
