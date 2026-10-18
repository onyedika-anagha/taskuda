import type { AiPrompt } from '@/types/ai'
import { AiRequestError } from './aiErrors'
import { fetchJson } from './httpJson'

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta'

function modelPath(model: string): string {
  const id = model.trim().replace(/^models\//, '')
  if (!/^[\w.-]+$/.test(id)) throw new AiRequestError('model-not-found')
  return `${BASE_URL}/models/${id}`
}

/** The key goes in a header, never in the URL, so it can't leak through logs or history (PRD AC12.6). */
const headers = (apiKey: string) => ({ 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' })

/** Checks the key and the model together by reading the model's details. */
export async function testGeminiKey(apiKey: string, model: string): Promise<void> {
  await fetchJson(modelPath(model), { method: 'GET', headers: headers(apiKey) })
}

interface GenerateContentResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[]
}

export async function generateWithGemini(apiKey: string, model: string, prompt: AiPrompt): Promise<string> {
  const body = {
    systemInstruction: { parts: [{ text: prompt.system }] },
    contents: [{ role: 'user', parts: [{ text: prompt.user }] }],
    generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 800 },
  }
  const data = (await fetchJson(`${modelPath(model)}:generateContent`, {
    method: 'POST',
    headers: headers(apiKey),
    body: JSON.stringify(body),
  })) as GenerateContentResponse
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('')
  if (!text) throw new AiRequestError('bad-response')
  return text
}
