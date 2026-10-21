import { useBudgetWarning } from '@/hooks/useBudgetWarning'
import { useCloseoutNudge } from '@/hooks/useCloseoutNudge'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { BudgetBanner } from './BudgetBanner'
import { CloseoutNudgeBanner } from './CloseoutNudgeBanner'

/** At most two banners show at once (design spec Section 5). */
const MAX_BANNERS = 2

/**
 * The S2 banners in order: offline (in the app shell) → nudge → budget. The budget banner waits
 * while two others show.
 */
export function CanvasBanners() {
  const online = useOnlineStatus()
  const nudge = useCloseoutNudge()
  const budget = useBudgetWarning()
  const shown = (online ? 0 : 1) + (nudge ? 1 : 0)

  return (
    <>
      {nudge ? <CloseoutNudgeBanner nudge={nudge} /> : null}
      {budget && shown < MAX_BANNERS ? <BudgetBanner warning={budget} /> : null}
    </>
  )
}
