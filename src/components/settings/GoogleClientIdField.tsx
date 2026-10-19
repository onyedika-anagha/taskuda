import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { toast } from 'sonner'
import { FormField } from '@/components/common/FormField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { deleteSetting, getSetting, setSetting } from '@/services/db/settingsRepository'
import { forgetAccessToken } from '@/services/google/googleAuth'
import { fieldDescribedBy } from '@/utils/formAria'

const KEY = 'google.clientId'
const HINT = 'For people who set up their own Google Cloud project. Leave empty to use Taskuda’s.'

/** CR1 "Use your own Google client ID" (Advanced). Stays on this device. */
export function GoogleClientIdField() {
  const saved = useLiveQuery(() => getSetting<string | null>(KEY, null), [])
  const [draft, setDraft] = useState<string | null>(null)
  const value = draft ?? saved ?? ''

  async function save() {
    const trimmed = value.trim()
    if (trimmed) await setSetting(KEY, trimmed)
    else await deleteSetting(KEY)
    // The next Google request signs in with the new client.
    forgetAccessToken()
    setDraft(null)
    toast.success(
      trimmed
        ? 'Your Google client ID is saved. Reconnect Google to use it.'
        : 'Using Taskuda’s Google client ID.',
    )
  }

  return (
    <details className="rounded-lg border bg-card p-4">
      <summary className="min-h-11 cursor-pointer content-center font-semibold">Advanced</summary>
      <div className="mt-3 grid gap-3">
        <FormField id="google-client-id" label="Use your own Google client ID" hint={HINT}>
          <Input
            id="google-client-id"
            value={value}
            autoComplete="off"
            spellCheck={false}
            placeholder="1234-abc.apps.googleusercontent.com"
            aria-describedby={fieldDescribedBy('google-client-id', undefined, HINT)}
            onChange={(event) => setDraft(event.target.value)}
          />
        </FormField>
        <Button variant="outline" className="min-h-11 justify-self-start" onClick={() => void save()}>
          Save client ID
        </Button>
      </div>
    </details>
  )
}
