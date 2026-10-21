import { beforeEach, describe, expect, it } from 'vitest'
import {
  getSetupStep,
  isIntroSeen,
  isSetupDone,
  markIntroSeen,
  markSetupDone,
  saveSetupStep,
} from './onboardingProgress'

describe('onboardingProgress', () => {
  beforeEach(() => window.localStorage.clear())

  it('starts with nothing seen or saved', () => {
    expect(isSetupDone()).toBe(false)
    expect(getSetupStep()).toBeNull()
    expect(isIntroSeen()).toBe(false)
  })

  it('AC34.5 remembers the step setup was left on', () => {
    saveSetupStep('workday')
    expect(getSetupStep()).toBe('workday')
  })

  it('finishing setup clears the saved step', () => {
    saveSetupStep('backup')
    markSetupDone()
    expect(isSetupDone()).toBe(true)
    expect(getSetupStep()).toBeNull()
  })

  it('ignores an unknown saved step', () => {
    window.localStorage.setItem('taskuda.setupStep', 'payments')
    expect(getSetupStep()).toBeNull()
  })

  it('remembers that the intro was seen', () => {
    markIntroSeen()
    expect(isIntroSeen()).toBe(true)
  })
})
