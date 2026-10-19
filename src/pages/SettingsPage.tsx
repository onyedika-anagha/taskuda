import { ArrowLeftIcon } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router'
import { AppBar } from '@/components/layout/AppBar'
import { AppShell } from '@/components/layout/AppShell'
import { SettingsList, SettingsSideNav } from '@/components/settings/SettingsNav'
import { Button } from '@/components/ui/button'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { SETTINGS_SECTIONS, findSection } from './settingsSections'

const DESKTOP = '(min-width: 1024px)'

/** S7 Settings: side nav on desktop; list → subpage on smaller screens (design spec Section 6). */
export function SettingsPage() {
  const { section: sectionId } = useParams()
  const isDesktop = useMediaQuery(DESKTOP)
  const section = findSection(sectionId)

  if (sectionId && !section) return <Navigate to="/settings" replace />
  if (!section && isDesktop) return <Navigate to={`/settings/${SETTINGS_SECTIONS[0].id}`} replace />

  // On phones a section page goes back to the list; everywhere else back goes to today.
  const backToList = !isDesktop && !!section
  const Section = section?.Component

  return (
    <AppShell
      appBar={
        <AppBar>
          <div className="flex items-center gap-1">
            <Button asChild variant="ghost" size="icon" className="size-11">
              <Link
                to={backToList ? '/settings' : '/'}
                aria-label={backToList ? 'Back to settings' : 'Back to today'}
              >
                <ArrowLeftIcon aria-hidden="true" />
              </Link>
            </Button>
            <h1 className="text-lg font-semibold">{backToList && section ? section.label : 'Settings'}</h1>
          </div>
        </AppBar>
      }
    >
      {isDesktop ? (
        <div className="mx-auto flex w-full max-w-5xl gap-8">
          <SettingsSideNav items={SETTINGS_SECTIONS} />
          <div className="min-w-0 flex-1">{Section ? <Section /> : null}</div>
        </div>
      ) : (
        <div className="mx-auto w-full max-w-2xl">
          {Section ? <Section /> : <SettingsList items={SETTINGS_SECTIONS} />}
        </div>
      )}
    </AppShell>
  )
}
