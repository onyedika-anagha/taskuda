import { create } from 'zustand'
import { AiRequestError } from '@/services/ai/aiErrors'
import { AiNotConfiguredError, getRecommendations } from '@/services/ai/aiProvider'
import type { RecommendationInput } from '@/services/ai/buildRecommendationPrompt'
import { VaultLockedError } from '@/services/crypto/errors'
import type { AiErrorKind } from '@/types/ai'
import { useCloseoutStore } from './closeoutStore'

export type RecommendationsFailure = 'not-configured' | 'locked' | 'offline' | AiErrorKind

export type RecommendationsRequest =
  { status: 'idle' } | { status: 'loading' } | { status: 'failed'; reason: RecommendationsFailure }

interface RecommendationsState {
  request: RecommendationsRequest
  /** Asks the provider; results are saved into the open closeout draft. */
  fetch: (input: RecommendationInput) => Promise<void>
  reset: () => void
}

function failureFor(error: unknown): RecommendationsFailure {
  if (error instanceof AiNotConfiguredError) return 'not-configured'
  if (error instanceof VaultLockedError) return 'locked'
  if (error instanceof AiRequestError) return error.kind
  return 'other'
}

export const useRecommendationsStore = create<RecommendationsState>((set, get) => ({
  request: { status: 'idle' },

  fetch: async (input) => {
    if (get().request.status === 'loading') return
    if (!navigator.onLine) {
      set({ request: { status: 'failed', reason: 'offline' } })
      return
    }
    set({ request: { status: 'loading' } })
    try {
      const recommendations = await getRecommendations(input)
      useCloseoutStore.getState().setRecommendations(recommendations)
      set({ request: { status: 'idle' } })
    } catch (error) {
      set({ request: { status: 'failed', reason: failureFor(error) } })
    }
  },

  reset: () => set({ request: { status: 'idle' } }),
}))
