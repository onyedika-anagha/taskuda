import { GoogleAuthError } from '@/services/google/googleAuth'

/** Why connecting a Google service failed, for the user (design spec Section 8). */
export function googleConnectErrorMessage(error: unknown, service: string): string {
  if (error instanceof GoogleAuthError) {
    if (error.kind === 'popup-closed' || error.kind === 'denied') {
      return 'Google sign-in was cancelled. You can connect later in Settings.'
    }
    if (error.kind === 'interaction-required')
      return 'Your browser blocked the Google sign-in window. Allow pop-ups and try again.'
    if (error.kind === 'missing-scope')
      return service === 'Google Drive'
        ? 'Taskuda needs permission to keep its backup file in your Drive.'
        : `Taskuda needs the permissions it asked for to use ${service}.`
    if (error.kind === 'not-configured') return 'Google sign-in isn’t set up for this copy of Taskuda.'
    if (error.kind === 'script-failed') return 'Couldn’t reach Google. Check your connection and try again.'
  }
  return `Couldn’t connect to ${service}. Try again.`
}
