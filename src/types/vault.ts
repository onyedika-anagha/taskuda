/** Names of the secrets Taskuda stores. */
export type SecretName = 'gemini' | 'openrouter' | 'jira'

/** AES-GCM output; both fields are base64. */
export interface EncryptedBlob {
  iv: string
  data: string
}

/**
 * Everything needed to read the secrets with the passphrase. Safe to include in the
 * Drive backup: it holds no plaintext and no key that works without the passphrase.
 */
export interface VaultRecord {
  id: 'vault'
  version: 1
  kdf: { name: 'PBKDF2'; hash: 'SHA-256'; iterations: number; salt: string }
  /** The data key, encrypted with the passphrase-derived key. */
  passphraseWrappedKey: EncryptedBlob
  /** A known value encrypted with the data key, to confirm a device key opens *this* vault. */
  keyCheck: EncryptedBlob
  secrets: Partial<Record<SecretName, EncryptedBlob>>
  updatedAt: number
}

/** Lets this device open the vault without the passphrase. Never leaves the device or goes into backups. */
export interface DeviceKeyRecord {
  id: 'device'
  /** Non-extractable AES-GCM key: the browser can use it but nobody can read it out. */
  key: CryptoKey
  /** The data key, encrypted with `key`. */
  deviceWrappedKey: EncryptedBlob
}

export type VaultStatus = 'checking' | 'none' | 'locked' | 'unlocked'
