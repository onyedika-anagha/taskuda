import type { CSSProperties } from 'react'
import { NO_COMPANY_SHADES, getPaletteColor } from './companyPalette'

/**
 * CSS variables for a company's colors in both themes. Components read them with
 * `bg-(--note-tint) dark:bg-(--note-tint-dark)` and similar classes.
 */
export function noteColorVariables(colorId: string | null | undefined): CSSProperties {
  const { light, dark } = colorId ? getPaletteColor(colorId) : NO_COMPANY_SHADES
  return {
    '--note-tint': light.tint,
    '--note-edge': light.edge,
    '--note-text': light.text,
    '--note-tint-dark': dark.tint,
    '--note-edge-dark': dark.edge,
    '--note-text-dark': dark.text,
  } as CSSProperties
}
