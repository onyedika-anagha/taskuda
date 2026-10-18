/** `aria-describedby` value matching the hint/error ids rendered by `FormField`. */
export function fieldDescribedBy(id: string, error?: string, hint?: string): string | undefined {
  if (error) return `${id}-error`
  if (hint) return `${id}-hint`
  return undefined
}
