import { vi } from 'vitest'

class FakeUtterance {
  text: string
  voice: { voiceURI: string } | null = null
  constructor(text: string) {
    this.text = text
  }
}

const VOICES = [
  { voiceURI: 'voice-en', name: 'English', lang: 'en-US' },
  { voiceURI: 'voice-fr', name: 'Français', lang: 'fr-FR' },
]

/** Installs a fake Web Speech API; `spoken` records every utterance (text and voice). */
export function installFakeSpeech() {
  const spoken: { text: string; voiceURI: string | null; at: number }[] = []
  const speechSynthesis = {
    speak: vi.fn<(u: FakeUtterance) => void>((u) =>
      spoken.push({ text: u.text, voiceURI: u.voice?.voiceURI ?? null, at: Date.now() }),
    ),
    cancel: vi.fn<() => void>(),
    getVoices: () => VOICES,
    addEventListener: () => {},
    removeEventListener: () => {},
  }
  Object.defineProperty(window, 'speechSynthesis', { value: speechSynthesis, configurable: true })
  Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: FakeUtterance, configurable: true })
  return { spoken, speechSynthesis }
}

export function removeFakeSpeech(): void {
  delete (window as { speechSynthesis?: unknown }).speechSynthesis
  delete (window as { SpeechSynthesisUtterance?: unknown }).SpeechSynthesisUtterance
}
