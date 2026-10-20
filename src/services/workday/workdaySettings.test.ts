import { beforeEach, describe, expect, it } from 'vitest'
import { ValidationError } from '@/services/db/errors'
import { setSetting } from '@/services/db/settingsRepository'
import { isLocalOnlySetting } from '@/services/backup/backupSnapshot'
import { resetDatabase } from '@/test/resetDatabase'
import { getWorkingDays, normalizeWorkingDays, setWorkingDays } from './workdaySettings'

describe('workdaySettings (PRD FR19)', () => {
  beforeEach(resetDatabase)

  it('AC19.1 defaults to Monday to Friday', async () => {
    expect(await getWorkingDays()).toEqual([1, 2, 3, 4, 5])
  })

  it('saves days in Monday-first order without duplicates', async () => {
    await setWorkingDays([0, 6, 3, 3])
    expect(await getWorkingDays()).toEqual([3, 6, 0])
  })

  it('AC19.1 refuses to save no working days', async () => {
    await expect(setWorkingDays([])).rejects.toThrow(new ValidationError('Keep at least one working day.'))
    expect(await getWorkingDays()).toEqual([1, 2, 3, 4, 5])
  })

  it('falls back to the default when storage holds something unusable', async () => {
    await setSetting('workday.workingDays', ['monday', 9])
    expect(await getWorkingDays()).toEqual([1, 2, 3, 4, 5])
    expect(normalizeWorkingDays('1,2')).toEqual([])
  })

  it('is backed up, so it follows the user to a new device', () => {
    expect(isLocalOnlySetting('workday.workingDays')).toBe(false)
  })
})
