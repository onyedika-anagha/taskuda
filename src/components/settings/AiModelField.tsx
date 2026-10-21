import { useState } from 'react'
import { FormField } from '@/components/common/FormField'
import { Input } from '@/components/ui/input'
import { setAiModel } from '@/services/ai/aiSettings'
import { DEFAULT_MODELS, type AiProvider } from '@/types/ai'
import { fieldDescribedBy } from '@/utils/formAria'

interface AiModelFieldProps {
  provider: AiProvider
  value: string
}

/** Saves on blur; an empty value falls back to the default model. */
export function AiModelField({ provider, value }: AiModelFieldProps) {
  const [draft, setDraft] = useState(value)
  // The last value this field saved. `value` comes from a live query and can lag a save, so
  // comparing with it could skip the next one (e.g. clearing right after typing a model).
  const [saved, setSaved] = useState(value)
  const [lastValue, setLastValue] = useState(value)
  // When the stored model changes, a change made elsewhere (a restore, another tab) replaces the
  // draft. Our own save arriving later matches `saved` and changes nothing.
  if (value !== lastValue) {
    setLastValue(value)
    if (value !== saved) {
      setSaved(value)
      setDraft(value)
    }
  }
  const id = `ai-model-${provider}`
  const hint =
    provider === 'openrouter'
      ? `Default: ${DEFAULT_MODELS.openrouter} (OpenRouter picks a model for each request).`
      : `Default: ${DEFAULT_MODELS.gemini}.`

  return (
    <FormField id={id} label="Model" hint={hint}>
      <Input
        id={id}
        value={draft}
        autoComplete="off"
        spellCheck={false}
        aria-describedby={fieldDescribedBy(id, undefined, hint)}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => {
          const next = draft.trim() || DEFAULT_MODELS[provider]
          setDraft(next)
          if (next === saved) return
          setSaved(next)
          void setAiModel(provider, next)
        }}
      />
    </FormField>
  )
}
