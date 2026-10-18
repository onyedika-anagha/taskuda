export const AI_PROVIDERS = ['gemini', 'openrouter'] as const
export type AiProvider = (typeof AI_PROVIDERS)[number]

export const AI_PROVIDER_LABELS: Record<AiProvider, string> = {
  gemini: 'Gemini',
  openrouter: 'OpenRouter',
}

/**
 * Defaults checked against provider docs in Oct 2026: Gemini recommends 3.5 Flash-Lite for new projects;
 * OpenRouter's auto router picks a model per request, so it doesn't go stale.
 */
export const DEFAULT_MODELS: Record<AiProvider, string> = {
  gemini: 'gemini-3.5-flash-lite',
  openrouter: 'openrouter/auto',
}

export interface Recommendation {
  title: string
  detail: string
}

export type AiErrorKind =
  'rejected-key' | 'rate-limit' | 'timeout' | 'network' | 'model-not-found' | 'bad-response' | 'other'

export interface AiPrompt {
  system: string
  user: string
}

export interface AiSettings {
  provider: AiProvider | null
  models: Record<AiProvider, string>
  /** Providers the user agreed to send closeout data to (PRD AC13.3). */
  disclosureAccepted: Partial<Record<AiProvider, boolean>>
}
