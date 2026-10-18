import type { EncryptedBlob } from '@/types/vault'
import { base64ToBytes, bytesToBase64 } from '@/utils/base64'

/** OWASP 2023 guidance for PBKDF2-HMAC-SHA256. */
export const PBKDF2_ITERATIONS = 600_000
const IV_BYTES = 12
const SALT_BYTES = 16
const KEY_BYTES = 32

const encoder = new TextEncoder()
const decoder = new TextDecoder()

export function randomSalt(): string {
  return bytesToBase64(crypto.getRandomValues(new Uint8Array(SALT_BYTES)))
}

export function randomKeyBytes(): Uint8Array<ArrayBuffer> {
  return crypto.getRandomValues(new Uint8Array(KEY_BYTES))
}

/** Derives a non-extractable AES-256-GCM key from a passphrase. */
export async function deriveKeyFromPassphrase(
  passphrase: string,
  salt: string,
  iterations: number,
): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey('raw', encoder.encode(passphrase), 'PBKDF2', false, [
    'deriveKey',
  ])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt: base64ToBytes(salt), iterations },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

/** Imports raw key bytes as a non-extractable AES-GCM key. */
export function importAesKey(raw: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
}

export function generateDeviceKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
}

/** `context` is authenticated but not encrypted: decrypting with a different context fails. */
export async function encryptBytes(
  key: CryptoKey,
  plaintext: Uint8Array<ArrayBuffer>,
  context: string,
): Promise<EncryptedBlob> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES))
  const data = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: encoder.encode(context) },
    key,
    plaintext,
  )
  return { iv: bytesToBase64(iv), data: bytesToBase64(data) }
}

/** Rejects (OperationError) when the key or context is wrong or the data was changed. */
export async function decryptBytes(
  key: CryptoKey,
  blob: EncryptedBlob,
  context: string,
): Promise<Uint8Array<ArrayBuffer>> {
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToBytes(blob.iv), additionalData: encoder.encode(context) },
    key,
    base64ToBytes(blob.data),
  )
  return new Uint8Array(plaintext)
}

export function encryptText(key: CryptoKey, text: string, context: string): Promise<EncryptedBlob> {
  return encryptBytes(key, encoder.encode(text), context)
}

export async function decryptText(key: CryptoKey, blob: EncryptedBlob, context: string): Promise<string> {
  return decoder.decode(await decryptBytes(key, blob, context))
}
