import { AiRequestError, errorKindForStatus } from './aiErrors'

export const AI_TIMEOUT_MS = 30_000

/**
 * Fetches JSON from an AI provider with a timeout, mapping failures to `AiRequestError`.
 * Never logs the request: headers carry the user's key.
 */
export async function fetchJson(url: string, init: RequestInit): Promise<unknown> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS)
  let response: Response
  try {
    response = await fetch(url, {
      ...init,
      signal: controller.signal,
      credentials: 'omit',
      referrerPolicy: 'origin',
    })
  } catch {
    throw new AiRequestError(controller.signal.aborted ? 'timeout' : 'network')
  } finally {
    clearTimeout(timer)
  }
  if (!response.ok) throw new AiRequestError(errorKindForStatus(response.status))
  try {
    return await response.json()
  } catch {
    throw new AiRequestError('bad-response')
  }
}
