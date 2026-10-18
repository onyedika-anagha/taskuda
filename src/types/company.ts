export interface Company {
  id: string
  name: string
  /** Id of a color in `utils/companyPalette`. */
  colorId: string
  createdAt: number
  updatedAt: number
}

export interface CompanyInput {
  name: string
  colorId: string
}
