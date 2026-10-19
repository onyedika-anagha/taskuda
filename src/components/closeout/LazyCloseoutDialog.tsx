import { lazy, Suspense, type ComponentProps } from 'react'
import { useCloseoutStore } from '@/stores/closeoutStore'

const CloseoutDialog = lazy(async () => ({ default: (await import('./CloseoutDialog')).CloseoutDialog }))

/** Loads the closeout (and its report and AI code) the first time it's opened (NFR3). */
export function LazyCloseoutDialog(props: ComponentProps<typeof CloseoutDialog>) {
  const opened = useCloseoutStore((s) => s.view.mode !== 'closed')
  if (!opened) return null
  return (
    <Suspense fallback={null}>
      <CloseoutDialog {...props} />
    </Suspense>
  )
}
