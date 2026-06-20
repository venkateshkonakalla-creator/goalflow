'use client'
// src/context/AuthContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db, googleProvider } from '@/lib/firebase'
import { friendlyError } from '@/lib/errors'
import { trackSignup, trackLogin } from '@/lib/analytics'

interface AuthContextType {
  user: FirebaseUser | null
  loading: boolean
  signUp: (email: string, password: string, name: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<boolean>
  logOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // onAuthStateChanged fires on initial load with the persisted session
    // (if any), so users remain signed in after a page refresh.
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [])

  /** Creates the user's Firestore profile doc if it doesn't already exist. */
  async function ensureUserDoc(u: FirebaseUser): Promise<boolean> {
    const ref = doc(db, 'users', u.uid)
    const snap = await getDoc(ref)
    const isNew = !snap.exists()

    await setDoc(ref, {
      uid: u.uid,
      email: u.email,
      displayName: u.displayName,
      photoURL: u.photoURL,
      createdAt: snap.exists() ? snap.data()?.createdAt ?? serverTimestamp() : serverTimestamp(),
    }, { merge: true })

    return isNew
  }

  async function signUp(email: string, password: string, name: string) {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(cred.user, { displayName: name })
      await ensureUserDoc(cred.user)
      trackSignup('email')
    } catch (err) {
      throw new Error(friendlyError(err, 'Could not create your account. Please try again.'))
    }
  }

  async function signIn(email: string, password: string) {
    try {
      await signInWithEmailAndPassword(auth, email, password)
      trackLogin('email')
    } catch (err) {
      throw new Error(friendlyError(err, 'Could not sign in. Please check your details.'))
    }
  }

  /**
   * Returns `true` if this is the user's first sign-in (new account),
   * so the caller can redirect to onboarding.
   */
  async function signInWithGoogle(): Promise<boolean> {
    try {
      const cred = await signInWithPopup(auth, googleProvider)
      const isNew = await ensureUserDoc(cred.user)
      if (isNew) trackSignup('google')
      else trackLogin('google')
      return isNew
    } catch (err) {
      throw new Error(friendlyError(err, 'Google sign-in failed. Please try again.'))
    }
  }

  async function logOut() {
    try {
      await signOut(auth)
    } catch (err) {
      throw new Error(friendlyError(err, 'Could not sign out. Please try again.'))
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signInWithGoogle, logOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
