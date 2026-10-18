import { describe, expect, it } from 'vitest'
import { COMPANY_PALETTE, NO_COMPANY_SHADES, getPaletteColor, isPaletteColorId } from './companyPalette'
import { contrastRatio } from './contrast'

describe('company palette', () => {
  it('has 10 colors with unique ids and names', () => {
    expect(COMPANY_PALETTE).toHaveLength(10)
    expect(new Set(COMPANY_PALETTE.map((c) => c.id)).size).toBe(10)
    expect(new Set(COMPANY_PALETTE.map((c) => c.name)).size).toBe(10)
  })

  it.each(
    COMPANY_PALETTE.flatMap((c) => (['light', 'dark'] as const).map((theme) => [c.name, theme, c] as const)),
  )('DAC11 %s note text has ≥ 4.5:1 contrast in the %s theme', (_name, theme, color) => {
    expect(contrastRatio(color[theme].text, color[theme].tint)).toBeGreaterThanOrEqual(4.5)
  })

  it.each(
    COMPANY_PALETTE.flatMap((c) => (['light', 'dark'] as const).map((theme) => [c.name, theme, c] as const)),
  )('%s edge has ≥ 3:1 contrast against its note in the %s theme (non-text UI)', (_name, theme, color) => {
    expect(contrastRatio(color[theme].edge, color[theme].tint)).toBeGreaterThanOrEqual(3)
  })

  it.each(['light', 'dark'] as const)('DAC11 the no-company note meets contrast in the %s theme', (theme) => {
    const shade = NO_COMPANY_SHADES[theme]
    expect(contrastRatio(shade.text, shade.tint)).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(shade.edge, shade.tint)).toBeGreaterThanOrEqual(3)
  })

  it('falls back to a neutral color for unknown ids', () => {
    expect(isPaletteColorId('teal')).toBe(true)
    expect(isPaletteColorId('chartreuse')).toBe(false)
    expect(getPaletteColor('chartreuse').id).toBe('slate')
  })
})
