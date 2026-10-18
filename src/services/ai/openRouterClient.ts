import type { AiPrompt } from '@/types/ai'
import { AiRequestError } from './aiErrors'
import { fetchJson } from './httpJson'

const BASE_URL = 'https://openrouter.ai/api/v1'

const headers = (apiKey: string) => ({
  Authorization: `Bearer ${apiKey}`,
  'Content-Type': 'application/json',
  // Optional attribution shown on openrouter.ai.
  'X-Title': 'Taskuda',
})

/** Checks that the key is valid (GET /key returns the key's limits and usage). */
export async function testOpenRouterKey(apiKey: string): Promise<void> {
  await fetchJson(`${BASE_URL}/key`, { method: 'GET', headers: headers(apiKey) })
}

interface ChatCompletionResponse {
  choices?: { message?: { content?: string | null } }[]
}

export async function generateWithOpenRouter(
  apiKey: string,
  model: string,
  prompt: AiPrompt,
): Promise<string> {
  const data = (await fetchJson(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: headers(apiKey),
    body: JSON.stringify({
      model: model.trim(),
      max_tokens: 800,
      messages: [
        { role: 'system', content: prompt.system },
        { role: 'user', content: prompt.user },
      ],
    }),
  })) as ChatCompletionResponse
  const text = data.choices?.[0]?.message?.content
  if (!text) throw new AiRequestError('bad-response')
  return text
}
