import { useState } from 'react'
import { isInstallSnoozed, useInstallStore } from '@/stores/installStore'

/** Whether to show "Install Taskuda", plus the actions (PRD FR16, design F13). */
export function useInstallPrompt() {
  const event = useInstallStore((s) => s.event)
  const install = useInstallStore((s) => s.install)
  const dismiss = useInstallStore((s) => s.dismiss)
  const [snoozed, setSnoozed] = useState(() => isInstallSnoozed())

  return {
    /** The browser can install right now (used by About, which ignores "Not now"). */
    canInstall: !!event,
    /** Show the banner: installable and not snoozed. */
    showBanner: !!event && !snoozed,
    install,
    notNow() {
      dismiss()
      setSnoozed(true)
    },
  }
}
