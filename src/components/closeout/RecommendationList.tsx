import type { Recommendation } from '@/types/ai'

/** AI output, rendered as plain text only. */
export function RecommendationList({ recommendations }: { recommendations: Recommendation[] }) {
  return (
    <ol className="grid gap-3">
      {recommendations.map((item, index) => (
        <li key={index} className="rounded-lg border bg-card p-3">
          <p className="font-medium">{item.title}</p>
          <p className="text-sm text-muted-foreground">{item.detail}</p>
        </li>
      ))}
    </ol>
  )
}
