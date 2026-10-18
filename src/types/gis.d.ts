// Minimal typings for the parts of Google Identity Services (https://accounts.google.com/gsi/client) we use.

interface GisTokenResponse {
  access_token?: string
  expires_in?: number | string
  scope?: string
  error?: string
  error_description?: string
}

interface GisTokenClientConfig {
  client_id: string
  scope: string
  callback: (response: GisTokenResponse) => void
  error_callback?: (error: { type: 'popup_failed_to_open' | 'popup_closed' | 'unknown' }) => void
  prompt?: '' | 'none' | 'consent' | 'select_account'
  include_granted_scopes?: boolean
}

interface GisTokenClient {
  requestAccessToken: (override?: { prompt?: GisTokenClientConfig['prompt']; scope?: string }) => void
}

interface Window {
  google?: {
    accounts?: {
      oauth2?: {
        initTokenClient: (config: GisTokenClientConfig) => GisTokenClient
        hasGrantedAllScopes: (response: GisTokenResponse, first: string, ...rest: string[]) => boolean
        revoke: (accessToken: string, done?: () => void) => void
      }
    }
  }
}
