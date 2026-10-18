import { NavLink } from 'react-router'
import { cn } from '@/lib/utils'

export interface SettingsNavItem {
  id: string
  label: string
}

/** Section links for S7. The full side-nav / list layout comes in task 8.1. */
export function SettingsNav({ items }: { items: SettingsNavItem[] }) {
  return (
    <nav aria-label="Settings sections" className="mb-4 flex flex-wrap gap-1">
      {items.map((item) => (
        <NavLink
          key={item.id}
          to={`/settings/${item.id}`}
          className={({ isActive }) =>
            cn(
              'inline-flex min-h-11 items-center rounded-md px-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isActive ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-muted',
            )
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
