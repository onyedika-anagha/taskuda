export interface PaletteShade {
  /** Note background. */
  tint: string
  /** Top edge and swatch color. */
  edge: string
  /** Text on the note. */
  text: string
}

export interface PaletteColor {
  id: string
  /** Shown to screen readers and in the picker tooltip. */
  name: string
  light: PaletteShade
  dark: PaletteShade
}

/**
 * Ten fixed company colors (design spec Section 10).
 * Every tint/text pair must keep ≥ 4.5:1 contrast (DAC11); see companyPalette.test.ts.
 */
export const COMPANY_PALETTE: readonly PaletteColor[] = [
  {
    id: 'teal',
    name: 'Teal',
    light: { tint: '#d5f0ec', edge: '#0f766e', text: '#16302d' },
    dark: { tint: '#163a37', edge: '#2dd4bf', text: '#e6f7f4' },
  },
  {
    id: 'coral',
    name: 'Coral',
    light: { tint: '#fde0d9', edge: '#c2410c', text: '#3b1d14' },
    dark: { tint: '#43231b', edge: '#fb8a6b', text: '#fdeee9' },
  },
  {
    id: 'amber',
    name: 'Amber',
    light: { tint: '#fcefc7', edge: '#b45309', text: '#382a0c' },
    dark: { tint: '#3d3112', edge: '#fbbf24', text: '#fdf6e1' },
  },
  {
    id: 'violet',
    name: 'Violet',
    light: { tint: '#ebe2fb', edge: '#6d28d9', text: '#271a3f' },
    dark: { tint: '#2e2346', edge: '#a78bfa', text: '#f1ecfd' },
  },
  {
    id: 'sky',
    name: 'Sky',
    light: { tint: '#d9edfb', edge: '#0369a1', text: '#132b3b' },
    dark: { tint: '#17324a', edge: '#38bdf8', text: '#e7f4fd' },
  },
  {
    id: 'rose',
    name: 'Rose',
    light: { tint: '#fbdde6', edge: '#be123c', text: '#3b1621' },
    dark: { tint: '#431d29', edge: '#fb7192', text: '#fdebf0' },
  },
  {
    id: 'lime',
    name: 'Lime',
    light: { tint: '#e6f4cc', edge: '#4d7c0f', text: '#22310d' },
    dark: { tint: '#273a14', edge: '#a3e635', text: '#f1f9e3' },
  },
  {
    id: 'indigo',
    name: 'Indigo',
    light: { tint: '#dfe3fb', edge: '#4338ca', text: '#1c1f44' },
    dark: { tint: '#22264a', edge: '#818cf8', text: '#eceefd' },
  },
  {
    id: 'orange',
    name: 'Orange',
    light: { tint: '#fde6cf', edge: '#c2410c', text: '#3a210d' },
    dark: { tint: '#432a14', edge: '#fb923c', text: '#fdf0e3' },
  },
  {
    id: 'slate',
    name: 'Slate',
    light: { tint: '#e3e6ea', edge: '#475569', text: '#1e2530' },
    dark: { tint: '#273040', edge: '#94a3b8', text: '#edf0f4' },
  },
]

/** Plain paper note for tasks with no company. */
export const NO_COMPANY_SHADES: Pick<PaletteColor, 'light' | 'dark'> = {
  light: { tint: '#fffaf0', edge: '#78716c', text: '#2b2620' },
  dark: { tint: '#2a2622', edge: '#a8a29e', text: '#f3efe8' },
}

export const DEFAULT_COMPANY_COLOR_ID = COMPANY_PALETTE[0].id

const FALLBACK_COLOR = COMPANY_PALETTE[COMPANY_PALETTE.length - 1]

export function isPaletteColorId(id: string): boolean {
  return COMPANY_PALETTE.some((c) => c.id === id)
}

export function getPaletteColor(id: string): PaletteColor {
  return COMPANY_PALETTE.find((c) => c.id === id) ?? FALLBACK_COLOR
}

/** The first palette color no company uses yet, so each new company in setup stands out (AC34.2). */
export function nextUnusedColorId(usedColorIds: Iterable<string>): string {
  const used = new Set(usedColorIds)
  return COMPANY_PALETTE.find((c) => !used.has(c.id))?.id ?? DEFAULT_COMPANY_COLOR_ID
}
