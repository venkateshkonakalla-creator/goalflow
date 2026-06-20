// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()

// Persist auth sessions across page refreshes / browser restarts.
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch(() => {
    // Persistence may fail in some environments (e.g. private browsing) —
    // auth still works for the current session.
  })
}

// Firebase Analytics is browser-only and requires `measurementId` to be set.
// Returns null on the server or if analytics isn't supported/configured.
let analyticsInstance: Analytics | null = null
export async function getAnalyticsInstance(): Promise<Analytics | null> {
  if (typeof window === 'undefined') return null
  if (!firebaseConfig.measurementId) return null
  if (analyticsInstance) return analyticsInstance

  const supported = await isSupported().catch(() => false)
  if (!supported) return null

  analyticsInstance = getAnalytics(app)
  return analyticsInstance
}

export default app
