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
          if (next !== value) void setAiModel(provider, next)
        }}
      />
    </FormField>
  )
}
