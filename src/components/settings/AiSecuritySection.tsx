import { AiProviderPanel } from './AiProviderPanel'
import { SecurityPanel } from './SecurityPanel'

/** S7d AI & Security. */
export function AiSecuritySection() {
  return (
    <section aria-labelledby="ai-security-heading" className="grid gap-4">
      <h2 id="ai-security-heading" className="text-lg font-semibold">
        AI & Security
      </h2>
      <AiProviderPanel />
      <SecurityPanel />
    </section>
  )
}
