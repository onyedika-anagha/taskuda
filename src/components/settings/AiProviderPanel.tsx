import { ExternalLinkIcon } from 'lucide-react'
import { SecretField } from '@/components/security/SecretField'
import { Skeleton } from '@/components/ui/skeleton'
import { useAiSettings } from '@/hooks/useAiSettings'
import { cn } from '@/lib/utils'
import { setAiProvider } from '@/services/ai/aiSettings'
import { AI_PROVIDERS, AI_PROVIDER_LABELS, type AiProvider } from '@/types/ai'
import { AiModelField } from './AiModelField'
import { TestAiKeyButton } from './TestAiKeyButton'

const KEY_LINKS: Record<AiProvider, { href: string; label: string }> = {
  gemini: { href: 'https://aistudio.google.com/apikey', label: 'Get a Gemini key' },
  openrouter: { href: 'https://openrouter.ai/keys', label: 'Get an OpenRouter key' },
}

/** S7d AI: provider, own key, model and key test (PRD FR12, design F10). */
export function AiProviderPanel() {
  const settings = useAiSettings()

  if (!settings) return <Skeleton className="h-48 w-full" />
  const provider = settings.provider

  return (
    <section aria-labelledby="ai-heading" className="grid gap-4 rounded-lg border bg-card p-4">
      <h3 id="ai-heading" className="font-semibold">
        AI recommendations
      </h3>
      {!provider || !settings.keys[provider] ? (
        <p className="text-sm text-muted-foreground">No AI key added. AI recommendations are off.</p>
      ) : null}

      <fieldset className="grid gap-1.5">
        <legend className="mb-1.5 text-sm leading-none font-medium">Provider</legend>
        <div className="inline-flex w-full rounded-lg bg-muted p-1 sm:w-auto">
          {AI_PROVIDERS.map((option) => (
            <label
              key={option}
              className={cn(
                'flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-md px-4 text-sm font-medium sm:flex-none',
                'has-focus-visible:ring-2 has-focus-visible:ring-ring',
                provider === option ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground',
              )}
            >
              <input
                type="radio"
                name="ai-provider"
                value={option}
                checked={provider === option}
                onChange={() => void setAiProvider(option)}
                className="sr-only"
              />
              {AI_PROVIDER_LABELS[option]}
            </label>
          ))}
        </div>
      </fieldset>

      {provider ? (
        <div className="grid gap-4">
          <SecretField name={provider} label="API key" itemName={`${AI_PROVIDER_LABELS[provider]} key`} />
          <a
            href={KEY_LINKS[provider].href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-1 justify-self-start text-sm font-medium underline underline-offset-4 outline-none hover:no-underline focus-visible:ring-2 focus-visible:ring-ring"
          >
            {KEY_LINKS[provider].label}
            <ExternalLinkIcon aria-hidden="true" className="size-3.5" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
          <AiModelField
            key={provider}
            provider={provider}
            value={settings.models[provider]}
          />
          <TestAiKeyButton key={provider} provider={provider} disabled={!settings.keys[provider]} />
          <p className="text-xs text-muted-foreground">
            Tip: set a monthly spending limit in your {AI_PROVIDER_LABELS[provider]} account. Your key is sent
            only to {AI_PROVIDER_LABELS[provider]}, never to Taskuda.
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Pick a provider to add your key.</p>
      )}
    </section>
  )
}
