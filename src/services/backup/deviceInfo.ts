import { getSetting, setSetting } from '@/services/db/settingsRepository'

/** Stays on this device: never backed up, so a restored device keeps its own identity. */
export const DEVICE_ID_KEY = 'device.id'

export async function getDeviceId(): Promise<string> {
  const existing = await getSetting<string | null>(DEVICE_ID_KEY, null)
  if (existing) return existing
  const id = crypto.randomUUID()
  await setSetting(DEVICE_ID_KEY, id)
  return id
}

/** "Windows · Chrome", shown in the restore warning (design D4). */
export function getDeviceName(userAgent: string = navigator.userAgent): string {
  const os = /Windows/.test(userAgent)
    ? 'Windows'
    : /Android/.test(userAgent)
      ? 'Android'
      : /iPhone|iPad/.test(userAgent)
        ? 'iOS'
        : /Mac OS X/.test(userAgent)
          ? 'macOS'
          : /Linux/.test(userAgent)
            ? 'Linux'
            : 'Unknown device'
  const browser = /Edg\//.test(userAgent)
    ? 'Edge'
    : /Firefox\//.test(userAgent)
      ? 'Firefox'
      : /Chrome\//.test(userAgent)
        ? 'Chrome'
        : /Safari\//.test(userAgent)
          ? 'Safari'
          : 'Browser'
  return `${os} · ${browser}`
}
