import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setSetting } from '@/services/db/settingsRepository'
import { installFakeGis, removeFakeGis } from '@/test/fakeGoogle'
import { resetDatabase } from '@/test/resetDatabase'
import {
  DRIVE_APPDATA_SCOPE,
  GoogleAuthError,
  forgetAccessToken,
  getAccessToken,
  getClientId,
  revokeGoogleAccess,
} from './googleAuth'

describe('googleAuth', () => {
  beforeEach(async () => {
    forgetAccessToken()
    await resetDatabase()
  })
  afterEach(() => {
    removeFakeGis()
    vi.useRealTimers()
  })

  it('AC7.3 asks only for the app-data scope, with consent shown just once', async () => {
    const gis = installFakeGis()
    expect(await getAccessToken([DRIVE_APPDATA_SCOPE], { interactive: true })).toBe('fake-token')
    expect(gis.requests).toHaveLength(1)
    expect(gis.requests[0]).toMatchObject({
      client_id: 'test-client.apps.googleusercontent.com',
      scope: 'https://www.googleapis.com/auth/drive.appdata',
      prompt: '',
      include_granted_scopes: true,
    })
  })

  it('reuses the token until shortly before it expires', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    const gis = installFakeGis()
    await getAccessToken([DRIVE_APPDATA_SCOPE], { interactive: true })
    await getAccessToken([DRIVE_APPDATA_SCOPE])
    expect(gis.requests).toHaveLength(1)

    vi.setSystemTime(Date.now() + 3599_000 - 30_000)
    await getAccessToken([DRIVE_APPDATA_SCOPE])
    expect(gis.requests).toHaveLength(2)
    expect(gis.requests[1].prompt).toBe('none')
  })

  it('silent renewal that needs a click reports interaction-required', async () => {
    installFakeGis({ respond: () => ({ error: 'interaction_required' }) })
    await expect(getAccessToken([DRIVE_APPDATA_SCOPE])).rejects.toThrow(
      new GoogleAuthError('interaction-required'),
    )
  })

  it.each([
    ['popup_failed_to_open', true, 'interaction-required'],
    ['popup_closed', true, 'popup-closed'],
    ['unknown', true, 'unknown'],
  ] as const)('maps %s to %s', async (errorType, interactive, kind) => {
    installFakeGis({ respond: () => ({ errorType }) })
    await expect(getAccessToken([DRIVE_APPDATA_SCOPE], { interactive })).rejects.toMatchObject({ kind })
  })

  it('rejects a token without the requested scope', async () => {
    installFakeGis({ respond: () => ({ token: 't', scope: 'email' }) })
    await expect(getAccessToken([DRIVE_APPDATA_SCOPE], { interactive: true })).rejects.toMatchObject({
      kind: 'missing-scope',
    })
  })

  it('needs a client ID; a user’s own ID (CR1) wins over the built-in one', async () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', '')
    await expect(getAccessToken([DRIVE_APPDATA_SCOPE], { interactive: true })).rejects.toMatchObject({
      kind: 'not-configured',
    })
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'built-in')
    expect(await getClientId()).toBe('built-in')
    await setSetting('google.clientId', ' my-own ')
    expect(await getClientId()).toBe('my-own')
  })

  it('revokes and forgets the token on disconnect', async () => {
    const gis = installFakeGis()
    await getAccessToken([DRIVE_APPDATA_SCOPE], { interactive: true })
    await revokeGoogleAccess()
    expect(gis.revoked).toEqual(['fake-token'])
    await getAccessToken([DRIVE_APPDATA_SCOPE], { interactive: true })
    expect(gis.requests).toHaveLength(2)
  })
})
