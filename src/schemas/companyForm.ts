import { z } from 'zod'
import { COMPANY_NAME_MAX_LENGTH } from '@/services/db/companyRepository'
import { isPaletteColorId } from '@/utils/companyPalette'

export const companyFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Give the company a name.')
    .max(COMPANY_NAME_MAX_LENGTH, `Keep the name under ${COMPANY_NAME_MAX_LENGTH} characters.`),
  colorId: z.string().refine(isPaletteColorId, 'Pick one of the colors.'),
})

export type CompanyFormValues = z.infer<typeof companyFormSchema>
