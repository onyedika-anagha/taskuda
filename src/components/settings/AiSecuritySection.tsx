import { SecurityPanel } from './SecurityPanel'

/** S7d AI & Security. The AI provider settings join this section in task 6.1. */
export function AiSecuritySection() {
  return (
    <section aria-labelledby="ai-security-heading" className="grid gap-4">
      <h2 id="ai-security-heading" className="text-lg font-semibold">
        AI & Security
      </h2>
      <SecurityPanel />
    </section>
  )
}
