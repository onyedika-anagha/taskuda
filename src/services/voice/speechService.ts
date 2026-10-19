/** Thin wrapper over the Web Speech API (PRD FR9). Every call is safe on browsers without it (NFR9). */

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window
}

/** Available voices. Some browsers load them late, so this waits briefly for `voiceschanged`. */
export function listVoices(timeoutMs = 1500): Promise<SpeechSynthesisVoice[]> {
  if (!isSpeechSupported()) return Promise.resolve([])
  const now = window.speechSynthesis.getVoices()
  if (now.length) return Promise.resolve(now)
  return new Promise((resolve) => {
    const done = () => {
      window.speechSynthesis.removeEventListener('voiceschanged', done)
      clearTimeout(timer)
      resolve(window.speechSynthesis.getVoices())
    }
    const timer = setTimeout(done, timeoutMs)
    window.speechSynthesis.addEventListener('voiceschanged', done)
  })
}

/** Speaks `text`, replacing anything still being said. Returns false if speech isn't available. */
export function speak(text: string, voiceURI: string | null = null): boolean {
  if (!isSpeechSupported()) return false
  const utterance = new SpeechSynthesisUtterance(text)
  if (voiceURI) {
    const voice = window.speechSynthesis.getVoices().find((v) => v.voiceURI === voiceURI)
    if (voice) utterance.voice = voice
  }
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
  return true
}
