import type { ComponentType } from 'react'
import { AboutSection } from '@/components/settings/AboutSection'
import { AiSecuritySection } from '@/components/settings/AiSecuritySection'
import { BackupSection } from '@/components/settings/BackupSection'
import { CompaniesSection } from '@/components/settings/CompaniesSection'
import { IntegrationsSection } from '@/components/settings/IntegrationsSection'
import { StatsSection } from '@/components/settings/StatsSection'

export interface SettingsSectionDef {
  id: string
  label: string
  Component: ComponentType
}

/** S7 sections in design order. Voice (task 10) joins this list later. */
export const SETTINGS_SECTIONS: readonly SettingsSectionDef[] = [
  { id: 'companies', label: 'Companies', Component: CompaniesSection },
  { id: 'integrations', label: 'Integrations', Component: IntegrationsSection },
  { id: 'backup', label: 'Backup', Component: BackupSection },
  { id: 'ai-security', label: 'AI & Security', Component: AiSecuritySection },
  { id: 'stats', label: 'Stats', Component: StatsSection },
  { id: 'about', label: 'About', Component: AboutSection },
]

export function findSection(id: string | undefined): SettingsSectionDef | undefined {
  return SETTINGS_SECTIONS.find((s) => s.id === id)
}
