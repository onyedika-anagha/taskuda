import type { CSSProperties } from 'react'

interface RiskMarkerShade {
  /** Near-opaque paper / charcoal, so the marker reads the same on every company tint. */
  background: string
  /** Standard style text and icon. */
  text: string
  /** Strong style (Overdue, Overran) text and icon. */
  strong: string
}

/** Design Section 10. Checked for ≥ 4.5:1 text contrast in `riskMarkerColors.test.ts` (DAC28). */
export const RISK_MARKER_COLORS: Record<'light' | 'dark', RiskMarkerShade> = {
  light: { background: '#fffdf8', text: '#2a241c', strong: '#b42318' },
  dark: { background: '#1d1a16', text: '#f4efe6', strong: '#ff8f84' },
}

export function riskMarkerVariables(): CSSProperties {
  const { light, dark } = RISK_MARKER_COLORS
  return {
    '--risk-bg': light.background,
    '--risk-text': light.text,
    '--risk-strong': light.strong,
    '--risk-bg-dark': dark.background,
    '--risk-text-dark': dark.text,
    '--risk-strong-dark': dark.strong,
  } as CSSProperties
}
