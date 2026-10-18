import { ArrowLeftIcon } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router'
import { AppBar } from '@/components/layout/AppBar'
import { AppShell } from '@/components/layout/AppShell'
import { AiSecuritySection } from '@/components/settings/AiSecuritySection'
import { BackupSection } from '@/components/settings/BackupSection'
import { CompaniesSection } from '@/components/settings/CompaniesSection'
import { SettingsNav } from '@/components/settings/SettingsNav'
import { StatsSection } from '@/components/settings/StatsSection'
import { Button } from '@/components/ui/button'

// More sections (Integrations, Voice, About) join this map in later tasks.
const SECTIONS = {
  companies: { label: 'Companies', Component: CompaniesSection },
  backup: { label: 'Backup', Component: BackupSection },
  'ai-security': { label: 'AI & Security', Component: AiSecuritySection },
  stats: { label: 'Stats', Component: StatsSection },
} as const

const NAV_ITEMS = Object.entries(SECTIONS).map(([id, s]) => ({ id, label: s.label }))

type SectionId = keyof typeof SECTIONS

function isSectionId(value: string | undefined): value is SectionId {
  return !!value && value in SECTIONS
}

/** S7 Settings. */
export function SettingsPage() {
  const { section } = useParams()
  if (!isSectionId(section)) return <Navigate to="/settings/companies" replace />
  const Section = SECTIONS[section].Component

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
        <SettingsNav items={NAV_ITEMS} />
        <Section />
      </div>
    </AppShell>
  )
}
