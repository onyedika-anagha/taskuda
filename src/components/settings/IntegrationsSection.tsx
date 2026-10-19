import { CalendarCard } from './CalendarCard'
import { GoogleClientIdField } from './GoogleClientIdField'

/** S7b Integrations. The Jira card joins in task 11. */
export function IntegrationsSection() {
  return (
    <section aria-labelledby="integrations-heading" className="grid gap-4">
      <h2 id="integrations-heading" className="text-lg font-semibold">
        Integrations
      </h2>
      <CalendarCard />
      <GoogleClientIdField />
    </section>
  )
}
