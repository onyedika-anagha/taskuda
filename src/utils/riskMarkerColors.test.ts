import { describe, expect, it } from 'vitest'
import { contrastRatio } from './contrast'
import { RISK_MARKER_COLORS } from './riskMarkerColors'

describe('risk marker colors', () => {
  it.each(['light', 'dark'] as const)(
    'DAC28 both styles have ≥ 4.5:1 text contrast in the %s theme',
    (theme) => {
      const { background, text, strong } = RISK_MARKER_COLORS[theme]
      expect(contrastRatio(text, background)).toBeGreaterThanOrEqual(4.5)
      expect(contrastRatio(strong, background)).toBeGreaterThanOrEqual(4.5)
    },
  )
})
