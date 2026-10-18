import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/services/db/database'
import { ValidationError } from '@/services/db/errors'
import { resetDatabase } from '@/test/resetDatabase'
import { VaultLockedError, VaultMissingError, WrongPassphraseError } from './errors'
import {
  changePassphrase,
  createVault,
  getSecret,
  getVaultStatus,
  listSecretNames,
  lockVault,
  removeSecret,
  resetVault,
  setSecret,
  unlockWithDevice,
  unlockWithPassphrase,
} from './secretVault'

const PASSPHRASE = 'correct horse battery'
const GEMINI_KEY = 'AIzaSyEXAMPLE-not-a-real-key-1234'

/** Everything stored on the device, serialized, to search for plaintext. */
async function dumpStorage(): Promise<string> {
  const [vault, devices, settings] = await Promise.all([
    db.vault.toArray(),
    db.deviceKeys.toArray(),
    db.settings.toArray(),
  ])
  return JSON.stringify({ vault, devices: devices.map((d) => d.deviceWrappedKey), settings })
}

/** Simulates a new device: same vault (e.g. restored from Drive) but no device key and nothing in memory. */
async function moveToNewDevice(): Promise<void> {
  lockVault()
  await db.deviceKeys.clear()
}

describe('secretVault', () => {
  beforeEach(async () => {
    lockVault()
    await resetDatabase()
  })

  it('starts with no vault', async () => {
    expect(await getVaultStatus()).toBe('none')
    expect(await listSecretNames()).toEqual([])
  })

  it('D6 requires a passphrase of at least 8 characters', async () => {
    await expect(createVault('short')).rejects.toThrow(new ValidationError('Use at least 8 characters.'))
  })

  it('round-trips a secret', async () => {
    await createVault(PASSPHRASE)
    await setSecret('gemini', `  ${GEMINI_KEY}  `)
    expect(await getSecret('gemini')).toBe(GEMINI_KEY)
    expect(await listSecretNames()).toEqual(['gemini'])
  })

  it('AC12.3 stores no readable key, passphrase or data key', async () => {
    await createVault(PASSPHRASE)
    await setSecret('gemini', GEMINI_KEY)
    const stored = await dumpStorage()
    expect(stored).not.toContain(GEMINI_KEY)
    expect(stored).not.toContain(btoa(GEMINI_KEY))
    expect(stored).not.toContain(PASSPHRASE)
  })

  it('stores the device key as non-extractable', async () => {
    await createVault(PASSPHRASE)
    const device = await db.deviceKeys.get('device')
    expect(device?.key.extractable).toBe(false)
  })

  it('AC12.4 reopens on the same device after a restart without the passphrase', async () => {
    await createVault(PASSPHRASE)
    await setSecret('jira', 'jira-token')
    lockVault() // browser restart: memory is gone, IndexedDB stays
    expect(await getVaultStatus()).toBe('unlocked')
    expect(await getSecret('jira')).toBe('jira-token')
  })

  it('a new device needs the passphrase once, then remembers it', async () => {
    await createVault(PASSPHRASE)
    await setSecret('gemini', GEMINI_KEY)
    await moveToNewDevice()

    expect(await getVaultStatus()).toBe('locked')
    await expect(getSecret('gemini')).rejects.toThrow(VaultLockedError)

    await unlockWithPassphrase(PASSPHRASE)
    expect(await getSecret('gemini')).toBe(GEMINI_KEY)
    lockVault()
    expect(await unlockWithDevice()).toBe(true)
  })

  it('AC12.5 a wrong passphrase keeps the vault locked', async () => {
    await createVault(PASSPHRASE)
    await setSecret('gemini', GEMINI_KEY)
    await moveToNewDevice()
    await expect(unlockWithPassphrase('wrong passphrase')).rejects.toThrow(WrongPassphraseError)
    expect(await getVaultStatus()).toBe('locked')
  })

  it('drops a device key that no longer fits a replaced vault', async () => {
    await createVault(PASSPHRASE)
    const otherDevice = await db.deviceKeys.get('device')
    await resetVault()
    await createVault('another passphrase')
    lockVault()
    if (otherDevice) await db.deviceKeys.put(otherDevice)
    expect(await unlockWithDevice()).toBe(false)
    expect(await db.deviceKeys.get('device')).toBeUndefined()
  })

  it('secrets cannot be swapped between names', async () => {
    await createVault(PASSPHRASE)
    await setSecret('gemini', GEMINI_KEY)
    const vault = await db.vault.get('vault')
    if (!vault?.secrets.gemini) throw new Error('missing')
    await db.vault.put({ ...vault, secrets: { openrouter: vault.secrets.gemini } })
    await expect(getSecret('openrouter')).rejects.toMatchObject({ name: 'OperationError' })
  })

  it('changes the passphrase after checking the current one', async () => {
    await createVault(PASSPHRASE)
    await setSecret('gemini', GEMINI_KEY)
    await expect(changePassphrase('wrong passphrase', 'new passphrase')).rejects.toThrow(WrongPassphraseError)
    await changePassphrase(PASSPHRASE, 'new passphrase')

    await moveToNewDevice()
    await expect(unlockWithPassphrase(PASSPHRASE)).rejects.toThrow(WrongPassphraseError)
    await unlockWithPassphrase('new passphrase')
    expect(await getSecret('gemini')).toBe(GEMINI_KEY)
  })

  it('removes one secret', async () => {
    await createVault(PASSPHRASE)
    await setSecret('gemini', GEMINI_KEY)
    await setSecret('jira', 'jira-token')
    await removeSecret('gemini')
    expect(await getSecret('gemini')).toBeUndefined()
    expect(await listSecretNames()).toEqual(['jira'])
  })

  it('reset removes every secret and the passphrase', async () => {
    await createVault(PASSPHRASE)
    await setSecret('gemini', GEMINI_KEY)
    await resetVault()
    expect(await getVaultStatus()).toBe('none')
    expect(await db.deviceKeys.count()).toBe(0)
    await expect(setSecret('gemini', GEMINI_KEY)).rejects.toThrow(VaultLockedError)
  })

  it('refuses to save a secret before a passphrase is set', async () => {
    await expect(removeSecret('gemini')).rejects.toThrow(VaultMissingError)
  })

  it('rejects an empty secret', async () => {
    await createVault(PASSPHRASE)
    await expect(setSecret('gemini', '   ')).rejects.toThrow(ValidationError)
  })
})
