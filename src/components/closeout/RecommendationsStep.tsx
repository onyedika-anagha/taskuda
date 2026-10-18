import { SparklesIcon } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'

/**
 * Step 3. Until AI recommendations are wired in (task 6.4) this shows the "no key" state,
 * and the footer's Skip moves on, so the closeout can always be finished (PRD AC13.2).
 */
export function RecommendationsStep() {
  return (
    <div className="grid gap-3">
      <h3 className="font-semibold">Recommendations for tomorrow</h3>
      <p className="flex items-start gap-2 text-sm">
        <SparklesIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        Add an AI key in Settings to get recommendations.
      </p>
      <Button asChild variant="outline" className="min-h-11 justify-self-start">
        <Link to="/settings/ai-security">Open Settings</Link>
      </Button>
    </div>
  )
}
