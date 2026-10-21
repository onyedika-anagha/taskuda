import { HourglassIcon } from 'lucide-react'
import { useEffect } from 'react'
import { NoticeBanner } from '@/components/common/NoticeBanner'
import type { BudgetWarning } from '@/hooks/useBudgetWarning'
import { announce } from '@/stores/announcerStore'

/** "You've spent 2 h in Taskuda today, past your 2 h budget…" with Dismiss (PRD AC29.3, design F17). */
export function BudgetBanner({ warning }: { warning: BudgetWarning }) {
  // Announced once when it appears, politely (design spec Section 7).
  useEffect(() => {
    announce(warning.message)
  }, [warning.message])

  return (
    <NoticeBanner
      icon={HourglassIcon}
      message={warning.message}
      actions={[{ label: 'Dismiss', variant: 'outline', onClick: warning.dismiss }]}
    />
  )
}
