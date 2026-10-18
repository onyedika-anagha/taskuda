export class RecordNotFoundError extends Error {
  constructor(entity: string, id: string) {
    super(`${entity} ${id} was not found`)
    this.name = 'RecordNotFoundError'
  }
}

/** `message` is user-facing copy (design spec Section 8). */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class DuplicateCompanyNameError extends Error {
  readonly companyName: string

  constructor(companyName: string) {
    super(`You already have a company called ${companyName}.`)
    this.name = 'DuplicateCompanyNameError'
    this.companyName = companyName
  }
}
