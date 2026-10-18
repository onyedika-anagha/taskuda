import { useEffect, useRef, useState } from 'react'
import { announce } from '@/stores/announcerStore'
import { copyText } from '@/utils/clipboard'

export type CopyState = 'idle' | 'copied' | 'failed'

/**
 * Copy with confirmation (PRD AC14.3, DAC5). When the browser blocks the clipboard,
 * the preview text is selected so the user can copy it by hand (design F5.5).
 */
export function useCopyReport(onCopied: (at: number) => void) {
  const [state, setState] = useState<CopyState>('idle')
  const previewRef = useRef<HTMLTextAreaElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  async function copy(text: string) {
    clearTimeout(timer.current)
    if (await copyText(text)) {
      setState('copied')
      announce('Report copied')
      onCopied(Date.now())
      timer.current = setTimeout(() => setState('idle'), 2000)
    } else {
      setState('failed')
      previewRef.current?.focus()
      previewRef.current?.select()
    }
  }

  return { state, copy, previewRef, reset: () => setState('idle') }
}
