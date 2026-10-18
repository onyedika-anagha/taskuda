/** `message` is user-facing copy (design spec Section 8, D5). */
export class WrongPassphraseError extends Error {
  constructor() {
    super('That passphrase doesn’t match.')
    this.name = 'WrongPassphraseError'
  }
}

export class VaultLockedError extends Error {
  constructor() {
    super('Enter your passphrase to unlock your keys.')
    this.name = 'VaultLockedError'
  }
}

export class VaultMissingError extends Error {
  constructor() {
    super('Set a passphrase before saving keys.')
    this.name = 'VaultMissingError'
  }
}

export class VaultExistsError extends Error {
  constructor() {
    super('A passphrase is already set on this device.')
    this.name = 'VaultExistsError'
  }
}
