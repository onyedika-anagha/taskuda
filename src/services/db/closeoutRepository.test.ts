import { beforeEach, describe, expect, it } from 'vitest'
import { resetDatabase } from '@/test/resetDatabase'
import type { Closeout } from '@/types/closeout'
import { getCloseout, listCloseouts, recordReportCopied, saveCloseout } from './closeoutRepository'
import { getSetting, setSetting, deleteSetting } from './settingsRepository'

const closeout = (dayKey: string, rating = 4): Closeout => ({
  dayKey,
  startedAt: 1000,
  finishedAt: 2000,
  reportCopiedAt: null,
  rating,
  reflection: '',
  outcomes: {},
})

describe('closeoutRepository', () => {
  beforeEach(resetDatabase)

  it('stores one closeout per day; closing out again replaces it', async () => {
    await saveCloseout(closeout('2026-10-19', 3))
    await saveCloseout(closeout('2026-10-19', 5))
    expect(await listCloseouts()).toHaveLength(1)
    expect((await getCloseout('2026-10-19'))?.rating).toBe(5)
  })

  it('records when the report was copied (M3)', async () => {
    await saveCloseout(closeout('2026-10-19'))
    await recordReportCopied('2026-10-19', 1500)
    expect((await getCloseout('2026-10-19'))?.reportCopiedAt).toBe(1500)
  })

  it('lists closeouts in day order', async () => {
    await saveCloseout(closeout('2026-10-20'))
    await saveCloseout(closeout('2026-10-19'))
    expect((await listCloseouts()).map((c) => c.dayKey)).toEqual(['2026-10-19', '2026-10-20'])
  })
})

describe('settingsRepository', () => {
  beforeEach(resetDatabase)

  it('returns the fallback until a value is set, then the value', async () => {
    expect(await getSetting('voice.leadMinutes', 5)).toBe(5)
    await setSetting('voice.leadMinutes', 10)
    expect(await getSetting('voice.leadMinutes', 5)).toBe(10)
    await deleteSetting('voice.leadMinutes')
    expect(await getSetting('voice.leadMinutes', 5)).toBe(5)
  })
})
