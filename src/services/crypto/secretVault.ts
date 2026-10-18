import { db } from '@/services/db/database'
import { ValidationError } from '@/services/db/errors'
import type { SecretName, VaultRecord, VaultStatus } from '@/types/vault'
import {
  PBKDF2_ITERATIONS,
  decryptBytes,
  decryptText,
  deriveKeyFromPassphrase,
  encryptBytes,
  encryptText,
  generateDeviceKey,
  importAesKey,
  randomKeyBytes,
  randomSalt,
} from './aesGcm'
import { VaultExistsError, VaultLockedError, VaultMissingError, WrongPassphraseError } from './errors'

/**
 * Encrypted storage for the AI keys and the Jira token (PRD FR12, NFR5).
 *
 * One random data key encrypts every secret. The data key itself is stored twice, encrypted:
 * - with a key derived from the user's passphrase (goes into the Drive backup), and
 * - with a non-extractable device key (stays on this device), so the passphrase is only
 *   needed once per device (AC12.4).
 * Decrypted secrets are returned to callers and never written anywhere.
 */

export const PASSPHRASE_MIN_LENGTH = 8

const DATA_KEY_CONTEXT = 'taskuda:data-key'
const KEY_CHECK_CONTEXT = 'taskuda:key-check'
const KEY_CHECK_VALUE = 'taskuda-key-check'
const secretContext = (name: SecretName) => `taskuda:secret:${name}`

/** The unlocked data key for this session; lives only in memory. */
let dataKey: CryptoKey | null = null

function checkPassphrase(passphrase: string): void {
  if (passphrase.length < PASSPHRASE_MIN_LENGTH) {
    throw new ValidationError(`Use at least ${PASSPHRASE_MIN_LENGTH} characters.`)
  }
}

function getVaultRecord(): Promise<VaultRecord | undefined> {
  return db.vault.get('vault')
}

async function requireVault(): Promise<VaultRecord> {
  const vault = await getVaultRecord()
  if (!vault) throw new VaultMissingError()
  return vault
}

function requireDataKey(): CryptoKey {
  if (!dataKey) throw new VaultLockedError()
  return dataKey
}

/** Stores a fresh device key that can open `rawDataKey` on this device. */
async function rememberOnThisDevice(rawDataKey: Uint8Array<ArrayBuffer>): Promise<void> {
  const key = await generateDeviceKey()
  const deviceWrappedKey = await encryptBytes(key, rawDataKey, DATA_KEY_CONTEXT)
  await db.deviceKeys.put({ id: 'device', key, deviceWrappedKey })
}

async function openDataKey(passphrase: string, vault: VaultRecord): Promise<Uint8Array<ArrayBuffer>> {
  const kek = await deriveKeyFromPassphrase(passphrase, vault.kdf.salt, vault.kdf.iterations)
  try {
    return await decryptBytes(kek, vault.passphraseWrappedKey, DATA_KEY_CONTEXT)
  } catch {
    throw new WrongPassphraseError()
  }
}

/** Opens the vault with this device's key, without the passphrase. Returns false if that isn't possible. */
export async function unlockWithDevice(): Promise<boolean> {
  if (dataKey) return true
  const [vault, device] = await Promise.all([getVaultRecord(), db.deviceKeys.get('device')])
  if (!vault || !device) return false
  try {
    const raw = await decryptBytes(device.key, device.deviceWrappedKey, DATA_KEY_CONTEXT)
    const candidate = await importAesKey(raw)
    raw.fill(0)
    // Throws if this device key belongs to an older vault.
    await decryptText(candidate, vault.keyCheck, KEY_CHECK_CONTEXT)
    dataKey = candidate
    return true
  } catch {
    // The vault was replaced (e.g. restored from another device's backup); this device key no longer fits.
    await db.deviceKeys.delete('device')
    return false
  }
}

export async function getVaultStatus(): Promise<Exclude<VaultStatus, 'checking'>> {
  if (!(await getVaultRecord())) return 'none'
  return (await unlockWithDevice()) ? 'unlocked' : 'locked'
}

/** First secret on this device: sets the passphrase (design D6). */
export async function createVault(passphrase: string): Promise<void> {
  checkPassphrase(passphrase)
  if (await getVaultRecord()) throw new VaultExistsError()

  const raw = randomKeyBytes()
  const salt = randomSalt()
  const kek = await deriveKeyFromPassphrase(passphrase, salt, PBKDF2_ITERATIONS)
  const key = await importAesKey(raw)
  const vault: VaultRecord = {
    id: 'vault',
    version: 1,
    kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations: PBKDF2_ITERATIONS, salt },
    passphraseWrappedKey: await encryptBytes(kek, raw, DATA_KEY_CONTEXT),
    keyCheck: await encryptText(key, KEY_CHECK_VALUE, KEY_CHECK_CONTEXT),
    secrets: {},
    updatedAt: Date.now(),
  }
  await db.vault.put(vault)
  await rememberOnThisDevice(raw)
  dataKey = key
  raw.fill(0)
}

/** New device or restored backup: opens the vault with the passphrase and remembers this device (D5). */
export async function unlockWithPassphrase(passphrase: string): Promise<void> {
  const vault = await requireVault()
  const raw = await openDataKey(passphrase, vault)
  await rememberOnThisDevice(raw)
  dataKey = await importAesKey(raw)
  raw.fill(0)
}

/** Re-encrypts the data key with a new passphrase; the secrets themselves don't change. */
export async function changePassphrase(currentPassphrase: string, nextPassphrase: string): Promise<void> {
  checkPassphrase(nextPassphrase)
  const vault = await requireVault()
  const raw = await openDataKey(currentPassphrase, vault)
  const salt = randomSalt()
  const kek = await deriveKeyFromPassphrase(nextPassphrase, salt, PBKDF2_ITERATIONS)
  await db.vault.put({
    ...vault,
    kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations: PBKDF2_ITERATIONS, salt },
    passphraseWrappedKey: await encryptBytes(kek, raw, DATA_KEY_CONTEXT),
    updatedAt: Date.now(),
  })
  raw.fill(0)
}

export async function setSecret(name: SecretName, value: string): Promise<void> {
  const trimmed = value.trim()
  if (!trimmed) throw new ValidationError('Paste the key first.')
  const key = requireDataKey()
  const vault = await requireVault()
  const blob = await encryptText(key, trimmed, secretContext(name))
  await db.vault.put({ ...vault, secrets: { ...vault.secrets, [name]: blob }, updatedAt: Date.now() })
}

/** Decrypted value for immediate use (e.g. one API call). Callers must not store or log it. */
export async function getSecret(name: SecretName): Promise<string | undefined> {
  const vault = await getVaultRecord()
  const blob = vault?.secrets[name]
  if (!blob) return undefined
  return decryptText(requireDataKey(), blob, secretContext(name))
}

export async function removeSecret(name: SecretName): Promise<void> {
  const vault = await requireVault()
  const secrets = { ...vault.secrets }
  delete secrets[name]
  await db.vault.put({ ...vault, secrets, updatedAt: Date.now() })
}

/** Which secrets exist, without decrypting anything. */
export async function listSecretNames(): Promise<SecretName[]> {
  const vault = await getVaultRecord()
  return vault ? (Object.keys(vault.secrets) as SecretName[]) : []
}

/** "Reset secrets": removes all keys and the passphrase from this device (and, after the next backup, from Drive). */
export async function resetVault(): Promise<void> {
  await db.transaction('rw', db.vault, db.deviceKeys, async () => {
    await db.vault.delete('vault')
    await db.deviceKeys.delete('device')
  })
  dataKey = null
}

/** Forgets the unlocked key for this session. */
export function lockVault(): void {
  dataKey = null
}
