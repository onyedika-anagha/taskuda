import { getSetting } from '@/services/db/settingsRepository'

/**
 * Google sign-in in the browser with the Identity Services token model (PRD constraint: no backend).
 * Access tokens last about an hour and there is no refresh token, so they are kept in memory only
 * and renewed silently when possible; when Google needs a click, callers show "Reconnect Google".
 */

export const DRIVE_APPDATA_SCOPE = 'https://www.googleapis.com/auth/drive.appdata'

const GIS_SRC = 'https://accounts.google.com/gsi/client'
/** Renew a little before Google's expiry. */
const EXPIRY_MARGIN_MS = 60_000

export type GoogleAuthErrorKind =
  | 'not-configured'
  | 'script-failed'
  /** A click is needed (popup blocked, or silent renewal not possible). */
  | 'interaction-required'
  | 'popup-closed'
  | 'denied'
  | 'missing-scope'
  | 'unknown'

export class GoogleAuthError extends Error {
  readonly kind: GoogleAuthErrorKind

  constructor(kind: GoogleAuthErrorKind) {
    super(`Google sign-in failed: ${kind}`)
    this.name = 'GoogleAuthError'
    this.kind = kind
  }
}

interface Token {
  accessToken: string
  expiresAt: number
  scopes: Set<string>
}

let token: Token | null = null
let scriptLoading: Promise<void> | null = null

/** The Google Cloud OAuth client ID: a user's own one (CR1, setting) wins over the built-in one. */
export async function getClientId(): Promise<string | null> {
  const own = await getSetting<string | null>('google.clientId', null)
  return own?.trim() || import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || null
}

function loadGis(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve()
  scriptLoading ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = GIS_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      scriptLoading = null
      reject(new GoogleAuthError('script-failed'))
    }
    document.head.appendChild(script)
  })
  return scriptLoading
}

function hasValidToken(scopes: string[]): boolean {
  return (
    !!token && token.expiresAt - EXPIRY_MARGIN_MS > Date.now() && scopes.every((s) => token?.scopes.has(s))
  )
}

async function requestToken(scopes: string[], interactive: boolean): Promise<Token> {
  const clientId = await getClientId()
  if (!clientId) throw new GoogleAuthError('not-configured')
  await loadGis()
  const oauth2 = window.google?.accounts?.oauth2
  if (!oauth2) throw new GoogleAuthError('script-failed')

  return new Promise<Token>((resolve, reject) => {
    const client = oauth2.initTokenClient({
      client_id: clientId,
      scope: scopes.join(' '),
      include_granted_scopes: true,
      // '' shows consent only the first time; 'none' never shows a screen (silent renewal).
      prompt: interactive ? '' : 'none',
      callback: (response) => {
        if (response.error || !response.access_token) {
          const silentFailure = !interactive && /interaction|consent|login/.test(response.error ?? '')
          reject(new GoogleAuthError(silentFailure ? 'interaction-required' : 'denied'))
          return
        }
        if (!oauth2.hasGrantedAllScopes(response, scopes[0], ...scopes.slice(1))) {
          reject(new GoogleAuthError('missing-scope'))
          return
        }
        resolve({
          accessToken: response.access_token,
          expiresAt: Date.now() + Number(response.expires_in ?? 3600) * 1000,
          scopes: new Set((response.scope ?? '').split(' ').filter(Boolean)),
        })
      },
      error_callback: (error) => {
        if (error.type === 'popup_failed_to_open') reject(new GoogleAuthError('interaction-required'))
        else if (error.type === 'popup_closed')
          reject(new GoogleAuthError(interactive ? 'popup-closed' : 'interaction-required'))
        else reject(new GoogleAuthError('unknown'))
      },
    })
    client.requestAccessToken()
  })
}

/**
 * An access token covering `scopes`. With `interactive`, may open Google's consent popup
 * (call from a click). Without it, only tries silently and throws `interaction-required` if it can't.
 */
export async function getAccessToken(scopes: string[], { interactive = false } = {}): Promise<string> {
  if (hasValidToken(scopes) && token) return token.accessToken
  const next = await requestToken(scopes, interactive)
  // Keep scopes granted earlier (include_granted_scopes), so one token serves Drive and Calendar.
  token = { ...next, scopes: new Set([...(token?.scopes ?? []), ...next.scopes]) }
  return next.accessToken
}

/** A Google API said the token is no longer valid (HTTP 401). */
export function forgetAccessToken(): void {
  token = null
}

/** Disconnect: revoke what was granted and forget the token. */
export async function revokeGoogleAccess(): Promise<void> {
  const current = token
  token = null
  if (!current) return
  await loadGis().catch(() => undefined)
  window.google?.accounts?.oauth2?.revoke(current.accessToken)
}
