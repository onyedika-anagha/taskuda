import { z } from 'zod'
import { PASSPHRASE_MIN_LENGTH } from '@/services/crypto/secretVault'

const MISMATCH = 'The passphrases don’t match.'
const TOO_SHORT = `Use at least ${PASSPHRASE_MIN_LENGTH} characters.`

/** D6 Set passphrase. */
export const setPassphraseSchema = z
  .object({
    passphrase: z.string().min(PASSPHRASE_MIN_LENGTH, TOO_SHORT),
    confirm: z.string(),
  })
  .refine((v) => v.passphrase === v.confirm, { message: MISMATCH, path: ['confirm'] })

export type SetPassphraseValues = z.infer<typeof setPassphraseSchema>

/** D5 Unlock. */
export const unlockSchema = z.object({
  passphrase: z.string().min(1, 'Enter your passphrase.'),
})

export type UnlockValues = z.infer<typeof unlockSchema>

export const changePassphraseSchema = z
  .object({
    current: z.string().min(1, 'Enter your current passphrase.'),
    next: z.string().min(PASSPHRASE_MIN_LENGTH, TOO_SHORT),
    confirm: z.string(),
  })
  .refine((v) => v.next === v.confirm, { message: MISMATCH, path: ['confirm'] })

export type ChangePassphraseValues = z.infer<typeof changePassphraseSchema>

export const secretValueSchema = z.object({
  value: z.string().trim().min(1, 'Paste the key first.'),
})

export type SecretValueValues = z.infer<typeof secretValueSchema>
