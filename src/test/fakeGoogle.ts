import { vi } from 'vitest'

type FakeGisAnswer =
  | { token: string; scope?: string; expiresIn?: number }
  | { error: string }
  | { errorType: 'popup_failed_to_open' | 'popup_closed' | 'unknown' }

export interface FakeGisOptions {
  /** What the next token requests answer with. */
  respond?: (config: GisTokenClientConfig) => FakeGisAnswer
}

/** Installs a fake `window.google.accounts.oauth2` and records every token request. */
export function installFakeGis(options: FakeGisOptions = {}) {
  const requests: GisTokenClientConfig[] = []
  const revoked: string[] = []
  const respond =
    options.respond ??
    ((config: GisTokenClientConfig): FakeGisAnswer => ({ token: 'fake-token', scope: config.scope }))

  window.google = {
    accounts: {
      oauth2: {
        initTokenClient: (config) => ({
          requestAccessToken: () => {
            requests.push(config)
            const answer = respond(config)
            queueMicrotask(() => {
              if ('errorType' in answer) config.error_callback?.({ type: answer.errorType })
              else if ('error' in answer) config.callback({ error: answer.error })
              else {
                config.callback({
                  access_token: answer.token,
                  expires_in: answer.expiresIn ?? 3599,
                  scope: answer.scope ?? config.scope,
                })
              }
            })
          },
        }),
        hasGrantedAllScopes: (response, first, ...rest) => {
          const granted = new Set((response.scope ?? '').split(' '))
          return [first, ...rest].every((s) => granted.has(s))
        },
        revoke: (token, done) => {
          revoked.push(token)
          done?.()
        },
      },
    },
  }
  vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-client.apps.googleusercontent.com')
  return { requests, revoked }
}

export function removeFakeGis(): void {
  delete window.google
  vi.unstubAllEnvs()
}
