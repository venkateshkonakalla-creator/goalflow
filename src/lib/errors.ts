// src/lib/errors.ts
// ─── ERROR MESSAGE MAPPING ─────────────────────────────────────────────────────
// Converts raw Firebase error codes into short, user-friendly messages.

const MESSAGES: Record<string, string> = {
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/user-disabled': 'This account has been disabled. Contact support.',
  'auth/user-not-found': 'No account found with this email.',
  'auth/wrong-password': 'Incorrect email or password.',
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/invalid-login-credentials': 'Incorrect email or password.',
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
  'auth/popup-closed-by-user': 'Sign-in popup was closed before completing.',
  'auth/cancelled-popup-request': 'Sign-in was cancelled.',
  'auth/popup-blocked': 'Your browser blocked the sign-in popup. Please allow popups and try again.',
  'auth/account-exists-with-different-credential': 'An account already exists with this email using a different sign-in method.',
  'auth/requires-recent-login': 'Please sign in again to continue.',
  'permission-denied': 'You don\'t have permission to do that.',
  'unavailable': 'Service is temporarily unavailable. Please try again.',
}

/**
 * Convert any thrown error (typically a Firebase error with a `.code`)
 * into a short, friendly message safe to show to end users.
 */
export function friendlyError(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (!err) return fallback

  const code = (err as { code?: string })?.code
  if (code && MESSAGES[code]) return MESSAGES[code]

  // Firestore errors sometimes surface as message strings containing the code
  const message = (err as { message?: string })?.message
  if (message) {
    const match = Object.keys(MESSAGES).find(key => message.includes(key))
    if (match) return MESSAGES[match]
  }

  return fallback
}
