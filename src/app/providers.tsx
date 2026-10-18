import type { ReactNode } from 'react'
import { ThemeProvider } from 'next-themes'
import { LiveAnnouncer } from '@/components/common/LiveAnnouncer'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <TooltipProvider>
        {children}
        <Toaster />
        <LiveAnnouncer />
      </TooltipProvider>
    </ThemeProvider>
  )
}
