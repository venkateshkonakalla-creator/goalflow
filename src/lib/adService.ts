import { collection, doc, addDoc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'
import { 
  getUserUsage as dbGetUserUsage, 
  updateUserUsage as dbUpdateUserUsage, 
  saveContactMessage as dbSaveContactMessage,
  type UserUsage
} from './db'
export type { UserUsage }

export interface AdConfig {
  banner320: string | undefined
  banner728: string | undefined
  socialBar: string | undefined
  smartlink: string | undefined
}

export interface DailyAdState {
  adsWatchedCount: number
  lastAdDate: string
  updatedAt: any
}


// ─── ADSTERRA CONFIG & INFO ───────────────────────────────────────────────────

/**
 * Safely reads Adsterra environment configurations without throwing.
 */
export function getAdConfig(): AdConfig {
  return {
    banner320: process.env.NEXT_PUBLIC_ADSTERRA_BANNER_320,
    banner728: process.env.NEXT_PUBLIC_ADSTERRA_BANNER_728,
    socialBar: process.env.NEXT_PUBLIC_ADSTERRA_SOCIALBAR,
    smartlink: process.env.NEXT_PUBLIC_ADSTERRA_SMARTLINK,
  }
}

// ─── FUTURE ADSTERRA INTEGRATION PREPARATION ─────────────────────────────────

/**
 * Placeholder method for showing a rewarded ad via Adsterra.
 * Currently simulates visual loading and returns success/failure status.
 */
export async function showRewardedAd(feature: string): Promise<boolean> {
  console.log(`[Adsterra] Preparing rewarded ad for feature: ${feature}`)
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true)
    }, 100)
  })
}

/**
 * Placeholder for showing/tracking Banner Ad displays.
 */
export function showBannerAd() {
  console.log('[Adsterra] Banner Ad displayed')
}

/**
 * Placeholder for showing/tracking Social Bar Ad displays.
 */
export function showSocialBar() {
  console.log('[Adsterra] Social Bar Ad displayed')
}

/**
 * Placeholder to track when rewarded ad completes.
 */
export function trackAdCompletion(feature: string) {
  console.log(`[Adsterra] Rewarded ad completion tracked for feature: ${feature}`)
}

/**
 * Placeholder method to track simulated ad revenue events.
 */
export async function trackAdRevenue(adId: string, amount: number): Promise<void> {
  console.log(`[Adsterra] Track Revenue Event: Ad ID ${adId}, Amount: $${amount}`)
}

// ─── FIRESTORE SERVICES WRAPPERS ─────────────────────────────────────────────

export async function getUserUsage(userId: string): Promise<UserUsage> {
  return dbGetUserUsage(userId)
}

export async function setUserUsage(userId: string, data: Partial<UserUsage>): Promise<void> {
  await dbUpdateUserUsage(userId, data)
}

export async function saveContactMessage(userId: string | null, data: { name: string; email: string; message: string }): Promise<string> {
  return dbSaveContactMessage(userId, data)
}


// ─── FIRESTORE SERVICES ──────────────────────────────────────────────────────

/**
 * Logs an ad-related event to the ad_events collection in Firestore.
 */
export async function logAdEvent(
  userId: string,
  eventType: 'ad_started' | 'ad_completed' | 'ad_failed' | 'feature_unlocked',
  feature: string
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'ad_events'), {
      userId,
      eventType,
      feature,
      timestamp: serverTimestamp(),
    })
    console.log(`[logAdEvent] Logged ${eventType} for ${feature}. Doc ID: ${docRef.id}`)
    return docRef.id
  } catch (error) {
    console.error('[logAdEvent] Error logging ad event:', error)
    return ''
  }
}

/**
 * Gets daily ad watch state for a user from Firestore.
 */
export async function getDailyAdState(userId: string): Promise<Omit<DailyAdState, 'userId'> | null> {
  try {
    const snap = await getDoc(doc(db, 'user_ad_state', userId))
    if (!snap.exists()) return null
    return snap.data() as Omit<DailyAdState, 'userId'>
  } catch (error) {
    console.error('[getDailyAdState] Error getting daily ad state:', error)
    return null
  }
}

/**
 * Saves daily ad watch state for a user to Firestore.
 */
export async function saveDailyAdState(
  userId: string,
  state: { adsWatchedCount: number; lastAdDate: string }
): Promise<void> {
  try {
    await setDoc(doc(db, 'user_ad_state', userId), {
      ...state,
      updatedAt: serverTimestamp(),
    }, { merge: true })
    console.log('[saveDailyAdState] Daily ad state saved for user:', userId, state)
  } catch (error) {
    console.error('[saveDailyAdState] Error saving daily ad state:', error)
  }
}

/**
 * Saves user feedback to the feedback collection in Firestore.
 */
export async function saveFeedback(
  userId: string | null,
  feedback: { rating: number; message: string; email?: string }
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'feedback'), {
      ...feedback,
      userId,
      createdAt: serverTimestamp(),
    })
    console.log('[saveFeedback] Feedback saved. Doc ID:', docRef.id)
    return docRef.id
  } catch (error) {
    console.error('[saveFeedback] Error saving feedback:', error)
    throw error
  }
}
