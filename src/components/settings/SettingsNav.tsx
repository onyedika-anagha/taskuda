import { ChevronRightIcon } from 'lucide-react'
import { NavLink } from 'react-router'
import { cn } from '@/lib/utils'

export interface SettingsNavItem {
  id: string
  label: string
}

/** Side navigation on desktop (≥ 1024px). */
export function SettingsSideNav({ items }: { items: readonly SettingsNavItem[] }) {
  return (
    <nav aria-label="Settings sections" className="w-52 shrink-0">
      <ul className="grid gap-1">
        {items.map((item) => (
          <li key={item.id}>
            <NavLink
              to={`/settings/${item.id}`}
              className={({ isActive }) =>
                cn(
                  'flex min-h-11 items-center rounded-md px-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isActive ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-muted',
                )
              }
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/** Phones and tablets: the list of sections, each opening as its own page. */
export function SettingsList({ items }: { items: readonly SettingsNavItem[] }) {
  return (
    <nav aria-label="Settings sections">
      <ul className="divide-y rounded-lg border bg-card">
        {items.map((item) => (
          <li key={item.id}>
            <NavLink
              to={`/settings/${item.id}`}
              className="flex min-h-14 items-center justify-between px-4 font-medium outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
            >
              {item.label}
              <ChevronRightIcon aria-hidden="true" className="size-4 text-muted-foreground" />
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
