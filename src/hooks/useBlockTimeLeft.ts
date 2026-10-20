import { useNow } from '@/hooks/useNow'
import { blockTimeLeft, type BlockTimeLeft } from '@/utils/timeBlocks'

/** Often enough that a new block shows well within a minute of starting (design DAC20). */
const TICK_MS = 15_000

/** The current block and the minutes left in it, while `enabled` (today only, PRD AC27.3). */
export function useBlockTimeLeft(enabled: boolean): BlockTimeLeft | null {
  const now = useNow(TICK_MS)
  return enabled ? blockTimeLeft(new Date(now)) : null
}
