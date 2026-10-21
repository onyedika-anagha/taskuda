import { beforeEach, describe, expect, it } from 'vitest'
import { ValidationError } from '@/services/db/errors'
import { setSetting } from '@/services/db/settingsRepository'
import { isLocalOnlySetting } from '@/services/backup/backupSnapshot'
import { resetDatabase } from '@/test/resetDatabase'
import {
  getCloseoutReminder,
  getDailyBudgetHours,
  getEyeBreaks,
  getQuietHours,
  getWorkdaySettings,
  getWorkingDays,
  normalizeWorkingDays,
  setCloseoutReminder,
  setDailyBudgetHours,
  setEyeBreaks,
  setQuietHours,
  setWorkingDays,
} from './workdaySettings'

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

  it('AC21.1 the close-out reminder defaults to 5:30 PM and can be turned off', async () => {
    expect(await getCloseoutReminder()).toBe('17:30')
    await setCloseoutReminder('18:15')
    expect(await getCloseoutReminder()).toBe('18:15')
    await setCloseoutReminder(null)
    expect(await getCloseoutReminder()).toBeNull()
    await expect(setCloseoutReminder('7pm')).rejects.toThrow(ValidationError)
  })

  it('AC23.1 quiet hours are off by default and can run overnight', async () => {
    expect(await getQuietHours()).toEqual({ enabled: false, start: '22:00', end: '07:00' })
    await setQuietHours({ enabled: true, start: '23:00', end: '06:30' })
    expect(await getQuietHours()).toEqual({ enabled: true, start: '23:00', end: '06:30' })
  })

  it('AC23.1 quiet hours can’t start and end at the same time', async () => {
    await expect(setQuietHours({ enabled: true, start: '09:00', end: '09:00' })).rejects.toThrow(
      new ValidationError('Start and end can’t be the same.'),
    )
  })

  it('reads all Workday settings together', async () => {
    expect(await getWorkdaySettings()).toEqual({
      workingDays: [1, 2, 3, 4, 5],
      closeoutReminder: '17:30',
      quietHours: { enabled: false, start: '22:00', end: '07:00' },
      eyeBreaks: { enabled: false, intervalMinutes: 20, start: '09:00', end: '17:00' },
      dailyBudgetHours: null,
    })
  })

  it('AC28.1 eye breaks save their interval and hours, and refuse an empty range', async () => {
    await setEyeBreaks({ enabled: true, intervalMinutes: 45, start: '08:00', end: '18:00' })
    expect(await getEyeBreaks()).toEqual({ enabled: true, intervalMinutes: 45, start: '08:00', end: '18:00' })
    await expect(
      setEyeBreaks({ enabled: true, intervalMinutes: 20, start: '09:00', end: '09:00' }),
    ).rejects.toThrow(new ValidationError('Start and end can’t be the same.'))
  })

  it('eye breaks fall back to defaults for unusable stored values', async () => {
    await setSetting('workday.eyeBreaks', { enabled: true, intervalMinutes: 7, start: 'x', end: '17:00' })
    expect(await getEyeBreaks()).toEqual({ enabled: true, intervalMinutes: 20, start: '09:00', end: '17:00' })
  })

  it('AC29.2 the daily budget is Off by default and takes 1–4 hours', async () => {
    expect(await getDailyBudgetHours()).toBeNull()
    await setDailyBudgetHours(3)
    expect(await getDailyBudgetHours()).toBe(3)
    await setDailyBudgetHours(null)
    expect(await getDailyBudgetHours()).toBeNull()
    await setSetting('workday.dailyBudgetHours', 9)
    expect(await getDailyBudgetHours()).toBeNull()
  })

  it('every Workday setting is backed up', () => {
    for (const key of [
      'workday.closeoutReminder',
      'workday.quietHours',
      'workday.eyeBreaks',
      'workday.dailyBudgetHours',
    ]) {
      expect(isLocalOnlySetting(key)).toBe(false)
    }
  })
})
