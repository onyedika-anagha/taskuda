import { z } from 'zod'
import type { Recommendation } from '@/types/ai'
import { AiRequestError } from './aiErrors'

const responseSchema = z.object({
  recommendations: z
    .array(z.object({ title: z.string().trim().min(1), detail: z.string().trim().min(1) }))
    .min(1),
})

/** Pulls the JSON object out of a model answer, even when wrapped in a code fence or prose. */
function extractJson(text: string): unknown {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end <= start) throw new AiRequestError('bad-response')
  try {
    return JSON.parse(text.slice(start, end + 1))
  } catch {
    throw new AiRequestError('bad-response')
  }
}

/** At most 4, each trimmed to a sane length; rendered as plain text, never HTML. */
export function parseRecommendations(text: string): Recommendation[] {
  const parsed = responseSchema.safeParse(extractJson(text))
  if (!parsed.success) throw new AiRequestError('bad-response')
  return parsed.data.recommendations.slice(0, 4).map((r) => ({
    title: r.title.slice(0, 120),
    detail: r.detail.slice(0, 400),
  }))
}
