import type { AiErrorKind } from '@/types/ai'

/** Reason fragments for "Gemini didn't respond: …" (design spec Section 8). */
export const AI_ERROR_REASONS: Record<AiErrorKind, string> = {
  'rejected-key': 'the key was rejected',
  'rate-limit': 'rate limit reached',
  timeout: 'the request timed out',
  network: 'the connection failed',
  'model-not-found': 'the model wasn’t found — check the model name in Settings',
  'bad-response': 'the answer couldn’t be read',
  other: 'something unexpected happened',
}

export class AiRequestError extends Error {
  readonly kind: AiErrorKind

  constructor(kind: AiErrorKind) {
    super(AI_ERROR_REASONS[kind])
    this.name = 'AiRequestError'
    this.kind = kind
  }
}

export function errorKindForStatus(status: number): AiErrorKind {
  if (status === 400 || status === 401 || status === 403) return 'rejected-key'
  if (status === 404) return 'model-not-found'
  if (status === 429) return 'rate-limit'
  return 'other'
}
