import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { isSpeechSupported, listVoices } from '@/services/voice/speechService'
import { getVoiceSettings } from '@/services/voice/voiceSettings'
import type { VoiceSettings } from '@/types/voice'

export interface VoiceOption {
  voiceURI: string
  label: string
}

/** Voice settings plus what this browser can do (design S7e). */
export function useVoiceSettings(): {
  settings: VoiceSettings | undefined
  supported: boolean
  voices: VoiceOption[]
} {
  const settings = useLiveQuery(() => getVoiceSettings(), [])
  const supported = isSpeechSupported()
  const [voices, setVoices] = useState<VoiceOption[]>([])

  useEffect(() => {
    if (!supported) return
    let cancelled = false
    void listVoices().then((list) => {
      if (cancelled) return
      setVoices(list.map((v) => ({ voiceURI: v.voiceURI, label: `${v.name} (${v.lang})` })))
    })
    return () => {
      cancelled = true
    }
  }, [supported])

  return { settings, supported, voices }
}
