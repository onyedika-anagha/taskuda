/**
 * localStorage for small per-device conveniences (a dismissed prompt, the welcome screen).
 * Storage can be blocked (private mode, site data off), so every access is guarded and the app
 * behaves sensibly without it.
 */
export function readLocal(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeLocal(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Ignored: losing a convenience flag is harmless.
  }
}

export function removeLocal(key: string): void {
  try {
    window.localStorage.removeItem(key)
  } catch {
    // Ignored, see writeLocal.
  }
}
