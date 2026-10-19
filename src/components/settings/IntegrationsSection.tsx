import { CalendarCard } from './CalendarCard'
import { GoogleClientIdField } from './GoogleClientIdField'
import { JiraCard } from './JiraCard'

/** S7b Integrations. */
export function IntegrationsSection() {
  return (
    <section aria-labelledby="integrations-heading" className="grid gap-4">
      <h2 id="integrations-heading" className="text-lg font-semibold">
        Integrations
      </h2>
      <CalendarCard />
      <JiraCard />
      <GoogleClientIdField />
    </section>
  )
}
