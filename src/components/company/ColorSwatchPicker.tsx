import { CheckIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { COMPANY_PALETTE } from '@/utils/companyPalette'
import { noteColorVariables } from '@/utils/noteColors'

interface ColorSwatchPickerProps {
  value: string
  onChange: (colorId: string) => void
  legend: string
}

/** The 10 company colors as native radio buttons, so arrow keys and screen readers work as expected. */
export function ColorSwatchPicker({ value, onChange, legend }: ColorSwatchPickerProps) {
  return (
    <fieldset className="grid gap-1.5">
      <legend className="mb-1.5 text-sm leading-none font-medium">{legend}</legend>
      <div className="flex flex-wrap gap-1">
        {COMPANY_PALETTE.map((color) => {
          const checked = color.id === value
          return (
            <label
              key={color.id}
              title={color.name}
              style={noteColorVariables(color.id)}
              className="grid size-11 cursor-pointer place-items-center rounded-full has-focus-visible:ring-2 has-focus-visible:ring-ring has-focus-visible:ring-offset-2 has-focus-visible:ring-offset-background"
            >
              <input
                type="radio"
                name="company-color"
                value={color.id}
                checked={checked}
                onChange={() => onChange(color.id)}
                className="sr-only"
              />
              <span className="sr-only">{color.name}</span>
              <span
                aria-hidden="true"
                className={cn(
                  'grid size-8 place-items-center rounded-full border-2 border-(--note-edge) bg-(--note-tint) dark:border-(--note-edge-dark) dark:bg-(--note-tint-dark)',
                  checked && 'ring-2 ring-foreground ring-offset-2 ring-offset-background',
                )}
              >
                {checked ? (
                  <CheckIcon className="size-4 text-(--note-text) dark:text-(--note-text-dark)" />
                ) : null}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
