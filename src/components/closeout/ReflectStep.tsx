import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RatingInput } from './RatingInput'

interface ReflectStepProps {
  rating: number | null
  reflection: string
  showError: boolean
  onRating: (rating: number) => void
  onReflection: (reflection: string) => void
}

/** Step 2: required 1–5 rating, optional reflection (PRD AC10.2). */
export function ReflectStep({ rating, reflection, showError, onRating, onReflection }: ReflectStepProps) {
  const errorVisible = showError && rating === null
  return (
    <div className="grid gap-5">
      <RatingInput value={rating} onChange={onRating} errorId={errorVisible ? 'rating-error' : undefined} />
      {errorVisible ? (
        <p id="rating-error" role="alert" className="-mt-3 text-sm font-medium text-destructive">
          Pick a rating to continue.
        </p>
      ) : null}
      <div className="grid gap-1.5">
        <Label htmlFor="closeout-reflection">Anything worth remembering? (optional)</Label>
        <Textarea
          id="closeout-reflection"
          rows={4}
          maxLength={2000}
          value={reflection}
          onChange={(event) => onReflection(event.target.value)}
        />
      </div>
    </div>
  )
}
