import { CheckIcon, TriangleAlertIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTestAiKey } from '@/hooks/useTestAiKey'
import type { AiProvider } from '@/types/ai'

export function TestAiKeyButton({ provider, disabled }: { provider: AiProvider; disabled: boolean }) {
  const { result, test } = useTestAiKey(provider)

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        variant="outline"
        className="min-h-11"
        disabled={disabled || result.state === 'testing'}
        onClick={() => void test()}
      >
        {result.state === 'testing' ? 'Testing…' : 'Test key'}
      </Button>
      <p aria-live="polite" className="text-sm">
        {result.state === 'ok' ? (
          <span className="inline-flex items-center gap-1.5">
            <CheckIcon aria-hidden="true" className="size-4" />
            Key works.
          </span>
        ) : null}
        {result.state === 'failed' ? (
          <span className="inline-flex items-center gap-1.5 text-destructive">
            <TriangleAlertIcon aria-hidden="true" className="size-4" />
            {result.message}
          </span>
        ) : null}
      </p>
    </div>
  )
}
