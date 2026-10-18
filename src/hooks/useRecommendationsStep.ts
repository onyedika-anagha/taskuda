import { useEffect, useMemo } from 'react'
import { acceptDisclosure } from '@/services/ai/aiSettings'
import type { RecommendationInput } from '@/services/ai/buildRecommendationPrompt'
import { useRecommendationsStore, type RecommendationsFailure } from '@/stores/recommendationsStore'
import { useVaultStore } from '@/stores/vaultStore'
import type { AiProvider, Recommendation } from '@/types/ai'
import type { CloseoutDraft } from '@/types/closeoutDraft'
import type { Company } from '@/types/company'
import type { Task } from '@/types/task'
import { useAiSettings } from './useAiSettings'
import { useOnlineStatus } from './useOnlineStatus'

export type RecommendationsView =
  | { state: 'loading-settings' }
  | { state: 'no-key' }
  | { state: 'disclosure'; provider: AiProvider }
  | { state: 'loading' }
  | { state: 'results'; recommendations: Recommendation[] }
  | { state: 'failed'; provider: AiProvider; reason: RecommendationsFailure }

/** Closeout step 3 states (design F5.4, PRD AC13.1–AC13.3). */
export function useRecommendationsStep(
  draft: CloseoutDraft,
  tasks: Task[],
  companiesById: Map<string, Company>,
) {
  const settings = useAiSettings()
  const online = useOnlineStatus()
  const request = useRecommendationsStore((s) => s.request)
  const fetchRecommendations = useRecommendationsStore((s) => s.fetch)
  const ensureUnlocked = useVaultStore((s) => s.ensureUnlocked)

  const provider = settings?.provider ?? null
  const configured = !!provider && !!settings?.keys[provider]
  const accepted = !!provider && !!settings?.disclosureAccepted[provider]
  const saved = draft.recommendations ?? null

  const input = useMemo<RecommendationInput>(
    () => ({
      dayKey: draft.dayKey,
      tasks,
      companiesById,
      outcomes: draft.outcomes,
      rating: draft.rating,
      reflection: draft.reflection,
    }),
    [draft.dayKey, draft.outcomes, draft.rating, draft.reflection, tasks, companiesById],
  )

  // Ask once per visit, after the user has agreed to send data to this provider.
  const shouldFetch = configured && accepted && !saved && request.status === 'idle'
  useEffect(() => {
    if (shouldFetch) void fetchRecommendations(input)
  }, [shouldFetch, fetchRecommendations, input])

  let view: RecommendationsView
  if (saved) view = { state: 'results', recommendations: saved }
  else if (!settings) view = { state: 'loading-settings' }
  else if (!configured || !provider) view = { state: 'no-key' }
  else if (!accepted) view = { state: 'disclosure', provider }
  else if (!online && request.status !== 'loading') view = { state: 'failed', provider, reason: 'offline' }
  else if (request.status === 'failed') view = { state: 'failed', provider, reason: request.reason }
  else view = { state: 'loading' }

  return {
    view,
    async send() {
      if (!provider) return
      await acceptDisclosure(provider)
    },
    retry: () => void fetchRecommendations(input),
    async unlockAndRetry() {
      if (await ensureUnlocked()) await fetchRecommendations(input)
    },
  }
}
