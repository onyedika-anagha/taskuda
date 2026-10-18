import { SettingsIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { SyncStatusIndicator } from '@/components/backup/SyncStatusIndicator'
import { Button } from '@/components/ui/button'

interface AppBarProps {
  /** Center area, e.g. the DayNavigator. */
  children?: ReactNode
  /** Tablet/desktop actions before Settings; phones show them in the bottom action bar. */
  actions?: ReactNode
}

export function AppBar({ children, actions }: AppBarProps) {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/90 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-1">
        <Link
          to="/"
          className="hidden shrink-0 rounded-md px-1 text-lg font-bold tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-ring sm:block"
        >
          Taskuda
        </Link>
        <div className="flex min-w-0 flex-1 justify-start lg:justify-center">{children}</div>
        {actions ? <div className="hidden items-center gap-2 md:flex">{actions}</div> : null}
        <SyncStatusIndicator />
        <Button asChild variant="ghost" size="icon" className="size-11">
          <Link to="/settings" aria-label="Settings">
            <SettingsIcon aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </header>
  )
}
