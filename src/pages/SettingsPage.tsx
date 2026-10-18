import { ArrowLeftIcon } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router'
import { AppBar } from '@/components/layout/AppBar'
import { AppShell } from '@/components/layout/AppShell'
import { CompaniesSection } from '@/components/settings/CompaniesSection'
import { Button } from '@/components/ui/button'

// More sections (Integrations, Backup, AI & Security, Voice, Stats, About) join this map in later tasks.
const SECTIONS = {
  companies: CompaniesSection,
} as const

type SectionId = keyof typeof SECTIONS

function isSectionId(value: string | undefined): value is SectionId {
  return !!value && value in SECTIONS
}

/** S7 Settings. */
export function SettingsPage() {
  const { section } = useParams()
  if (!isSectionId(section)) return <Navigate to="/settings/companies" replace />
  const Section = SECTIONS[section]

  return (
    <AppShell
      appBar={
        <AppBar>
          <div className="flex items-center gap-1">
            <Button asChild variant="ghost" size="icon" className="size-11">
              <Link to="/" aria-label="Back to today">
                <ArrowLeftIcon aria-hidden="true" />
              </Link>
            </Button>
            <h1 className="text-lg font-semibold">Settings</h1>
          </div>
        </AppBar>
      }
    >
      <div className="mx-auto w-full max-w-2xl">
        <Section />
      </div>
    </AppShell>
  )
}
