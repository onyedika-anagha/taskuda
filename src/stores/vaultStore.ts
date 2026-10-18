import { create } from 'zustand'
import * as vault from '@/services/crypto/secretVault'
import type { SecretName, VaultStatus } from '@/types/vault'

/** Which passphrase dialog is waiting for the user (design D5 / D6). */
export type VaultPrompt = 'set-passphrase' | 'unlock' | null

interface VaultState {
  status: VaultStatus
  prompt: VaultPrompt
  refresh: () => Promise<void>
  /**
   * Makes sure secrets can be read and written, asking for a passphrase if needed.
   * Resolves false if the user closes the dialog.
   */
  ensureUnlocked: () => Promise<boolean>
  /** Called by the dialogs once the user finished (true) or gave up (false). */
  finishPrompt: (unlocked: boolean) => void
  createVault: (passphrase: string) => Promise<void>
  unlock: (passphrase: string) => Promise<void>
  /** Resolves false if the user cancelled the passphrase prompt; rejects on other errors. */
  saveSecret: (name: SecretName, value: string) => Promise<boolean>
  removeSecret: (name: SecretName) => Promise<void>
  changePassphrase: (current: string, next: string) => Promise<void>
  resetSecrets: () => Promise<void>
}

// The open prompt's continuation. Kept outside the state: it isn't something to render.
let resolvePrompt: ((unlocked: boolean) => void) | null = null

export const useVaultStore = create<VaultState>((set, get) => ({
  status: 'checking',
  prompt: null,

  refresh: async () => {
    set({ status: await vault.getVaultStatus() })
  },

  ensureUnlocked: async () => {
    const status = await vault.getVaultStatus()
    set({ status })
    if (status === 'unlocked') return true
    resolvePrompt?.(false)
    return new Promise<boolean>((resolve) => {
      resolvePrompt = resolve
      set({ prompt: status === 'none' ? 'set-passphrase' : 'unlock' })
    })
  },

  finishPrompt: (unlocked) => {
    set({ prompt: null })
    resolvePrompt?.(unlocked)
    resolvePrompt = null
  },

  createVault: async (passphrase) => {
    await vault.createVault(passphrase)
    set({ status: 'unlocked' })
  },

  unlock: async (passphrase) => {
    await vault.unlockWithPassphrase(passphrase)
    set({ status: 'unlocked' })
  },

  saveSecret: async (name, value) => {
    if (!(await get().ensureUnlocked())) return false
    await vault.setSecret(name, value)
    return true
  },

  removeSecret: (name) => vault.removeSecret(name),

  changePassphrase: (current, next) => vault.changePassphrase(current, next),

  resetSecrets: async () => {
    await vault.resetVault()
    set({ status: 'none' })
  },
}))
