import { cn } from '@/lib/utils'
import { RATING_LABELS } from '@/utils/closeoutRules'

interface RatingInputProps {
  value: number | null
  onChange: (rating: number) => void
  errorId?: string
}

/** 1–5 day rating as five native radio buttons (design RatingInput). */
export function RatingInput({ value, onChange, errorId }: RatingInputProps) {
  return (
    <fieldset aria-describedby={errorId} className="grid gap-2">
      <legend className="mb-2 font-semibold">How did today go?</legend>
      <div className="grid grid-cols-5 gap-1 sm:gap-2">
        {[1, 2, 3, 4, 5].map((rating) => (
          <label
            key={rating}
            className={cn(
              'flex min-h-14 cursor-pointer flex-col items-center justify-center rounded-lg border text-sm',
              'has-focus-visible:ring-2 has-focus-visible:ring-ring',
              value === rating ? 'border-foreground bg-secondary font-semibold' : 'bg-card',
            )}
          >
            <input
              type="radio"
              name="day-rating"
              value={rating}
              checked={value === rating}
              onChange={() => onChange(rating)}
              className="sr-only"
            />
            <span className="text-base tabular-nums">{rating}</span>
            <span className="text-xs">{RATING_LABELS[rating]}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
