import { forgetAccessToken, getAccessToken } from './googleAuth'

export type GoogleApiErrorKind =
  'auth-expired' | 'network' | 'quota' | 'not-found' | 'server' | 'bad-response'

export class GoogleApiError extends Error {
  readonly kind: GoogleApiErrorKind
  readonly status: number | null

  constructor(kind: GoogleApiErrorKind, status: number | null = null) {
    super(`Google API request failed: ${kind}${status ? ` (${status})` : ''}`)
    this.name = 'GoogleApiError'
    this.kind = kind
    this.status = status
  }
}

function kindForStatus(status: number): GoogleApiErrorKind {
  if (status === 401) return 'auth-expired'
  if (status === 403 || status === 429) return 'quota'
  if (status === 404) return 'not-found'
  return 'server'
}

/**
 * Authorized request to a Google API. Never interactive: background work must not open popups.
 * Returns the raw Response (callers read JSON or text).
 */
export async function googleFetch(
  url: string,
  scopes: string[],
  init: RequestInit = {},
  options: { interactive?: boolean } = {},
): Promise<Response> {
  const accessToken = await getAccessToken(scopes, options)
  let response: Response
  try {
    response = await fetch(url, {
      ...init,
      credentials: 'omit',
      headers: { ...init.headers, Authorization: `Bearer ${accessToken}` },
    })
  } catch {
    throw new GoogleApiError('network')
  }
  if (response.status === 401) forgetAccessToken()
  if (!response.ok) throw new GoogleApiError(kindForStatus(response.status), response.status)
  return response
}
