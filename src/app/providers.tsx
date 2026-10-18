import type { ReactNode } from 'react'
import { ThemeProvider } from 'next-themes'
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
      </TooltipProvider>
    </ThemeProvider>
  )
}
