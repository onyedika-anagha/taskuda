import type { ReactNode } from 'react'

interface StepCardProps {
  title: string
  description: string
  children: ReactNode
}

/** Card frame shared by the welcome steps. */
export function StepCard({ title, description, children }: StepCardProps) {
  return (
    <section aria-labelledby="welcome-step-title" className="grid gap-4 rounded-xl border bg-card p-5">
      <div className="grid gap-1">
        <h2 id="welcome-step-title" className="text-lg font-semibold">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  )
}
