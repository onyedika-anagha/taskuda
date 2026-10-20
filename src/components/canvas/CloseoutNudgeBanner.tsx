import { MoonIcon } from 'lucide-react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { NoticeBanner } from '@/components/common/NoticeBanner'
import { useCloseoutNudge } from '@/hooks/useCloseoutNudge'
import { announce } from '@/stores/announcerStore'
import { useCloseoutStore } from '@/stores/closeoutStore'

/**
 * "It's 5:30 PM. Ready to close out your day?" (PRD FR21, design F16). Close out day always opens
 * today's closeout, so from another day it goes to today first.
 */
export function CloseoutNudgeBanner() {
  const nudge = useCloseoutNudge()
  const navigate = useNavigate()
  const openCloseout = useCloseoutStore((s) => s.openCloseout)
  const message = nudge?.message ?? null

  // Announced once when it appears, politely (design spec Section 7).
  useEffect(() => {
    if (message) announce(message)
  }, [message])

  if (!nudge) return null

  return (
    <NoticeBanner
      icon={MoonIcon}
      message={nudge.message}
      actions={[
        {
          label: 'Close out day',
          onClick: () => {
            void navigate('/')
            void openCloseout(nudge.dayKey)
          },
        },
        { label: 'Not today', variant: 'outline', onClick: nudge.dismiss },
      ]}
    />
  )
}
