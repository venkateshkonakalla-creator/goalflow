'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'
import { logAdEvent, getUserUsage, setUserUsage, type UserUsage } from '@/lib/adService'
import RewardedAdModal from '@/components/RewardedAdModal'

interface AdContextType {
  watchAd: (feature: string) => Promise<boolean>
  isUnlocked: (feature: string) => boolean
  consumeAd: (feature: string) => Promise<void>
  adsWatchedToday: number
  expenseUnlocked: boolean
  usageLoading: boolean
}

const AdContext = createContext<AdContextType | null>(null)

export function AdProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const { showToast } = useToast()

  // UI state for the RewardedAdModal
  const [modalOpen, setModalOpen] = useState(false)
  const [modalFeature, setModalFeature] = useState('')
  const [modalResolve, setModalResolve] = useState<((val: boolean) => void) | null>(null)

  // DB Usage state
  const [usage, setUsage] = useState<UserUsage>({
    freeGoalUsed: false,
    freeAffordabilityUsed: false,
    freePlanningUsed: false
  })

  // CRITICAL: Track whether usage has been loaded from Firestore.
  // While false, all features are LOCKED to prevent race-condition bypass.
  const [usageLoaded, setUsageLoaded] = useState(false)

  // Session-based unlocks (after watching an ad)
  const [sessionUnlocked, setSessionUnlocked] = useState<Record<string, boolean>>({})

  // Fetch usage stats when user changes
  useEffect(() => {
    if (!user) {
      console.log('🔒 [AdProvider] No user — resetting all usage state')
      setUsage({
        freeGoalUsed: false,
        freeAffordabilityUsed: false,
        freePlanningUsed: false
      })
      setSessionUnlocked({})
      setUsageLoaded(false)
      return
    }

    console.log('🔒 [AdProvider] User detected, loading usage from Firestore for:', user.uid)
    setUsageLoaded(false)

    const fetchUsage = async () => {
      try {
        const u = await getUserUsage(user.uid)
        console.log('🔒 [AdProvider] Usage loaded successfully:', JSON.stringify(u))
        setUsage(u)
        setUsageLoaded(true)
      } catch (e) {
        console.error('❌ [AdProvider] CRITICAL: Failed to load usage from Firestore. All features LOCKED to prevent bypass:', e)
        // On error, set all flags to true (locked).
        // This ensures Firestore errors do NOT grant free access.
        setUsage({
          freeGoalUsed: true,
          freeAffordabilityUsed: true,
          freePlanningUsed: true
        })
        setUsageLoaded(true)
        showToast('Could not load your usage data. Some features may require an ad.', 'error')
      }
    }

    fetchUsage()
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  // Helper to check if a feature is unlocked (first-use free OR ad watched in this session)
  const isUnlocked = useCallback((feature: string): boolean => {
    if (feature === 'expense_tracking') {
      console.log('🔓 [AdGate] isUnlocked(expense_tracking) → true (always free)')
      return true
    }

    // CRITICAL: While usage is loading from Firestore, lock everything.
    // This prevents the race condition where pages render "unlocked" before data arrives.
    if (!usageLoaded) {
      console.log(`🔒 [AdGate] isUnlocked(${feature}) → false (usage still loading from Firestore)`)
      return false
    }

    if (feature === 'goal_creation' && !usage.freeGoalUsed) {
      console.log('🔓 [AdGate] isUnlocked(goal_creation) → true (free use available, freeGoalUsed=false)')
      return true
    }

    if (feature === 'affordability_checker' && !usage.freeAffordabilityUsed) {
      console.log('🔓 [AdGate] isUnlocked(affordability_checker) → true (free use available, freeAffordabilityUsed=false)')
      return true
    }

    if (feature === 'savings_plan' && !usage.freePlanningUsed) {
      console.log('🔓 [AdGate] isUnlocked(savings_plan) → true (free use available, freePlanningUsed=false)')
      return true
    }

    const sessionResult = !!sessionUnlocked[feature]
    console.log(`🔒 [AdGate] isUnlocked(${feature}) → ${sessionResult} (free used, sessionUnlocked=${sessionResult})`)
    return sessionResult
  }, [usage, sessionUnlocked, usageLoaded])

  // Watch ad if subsequent use
  const watchAd = useCallback((feature: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (feature === 'expense_tracking') {
        console.log('🔓 [AdGate] watchAd(expense_tracking): always free, skipping ad')
        resolve(true)
        return
      }

      // If it's the first use, bypass ad showing
      if (feature === 'goal_creation' && !usage.freeGoalUsed) {
        console.log('🔓 [AdGate] watchAd(goal_creation): free use available, skipping ad')
        resolve(true)
        return
      }
      if (feature === 'affordability_checker' && !usage.freeAffordabilityUsed) {
        console.log('🔓 [AdGate] watchAd(affordability_checker): free use available, skipping ad')
        resolve(true)
        return
      }
      if (feature === 'savings_plan' && !usage.freePlanningUsed) {
        console.log('🔓 [AdGate] watchAd(savings_plan): free use available, skipping ad')
        resolve(true)
        return
      }

      // Otherwise, open rewarded modal
      console.log(`🎬 [AdGate] watchAd(${feature}): Free use consumed, showing rewarded ad modal`)
      setModalFeature(feature)
      setModalResolve(() => resolve)
      setModalOpen(true)

      if (user) {
        logAdEvent(user.uid, 'ad_started', feature)
      }
    })
  }, [user, usage])

  // Consume the lock (call this upon successful feature execution)
  const consumeAd = useCallback(async (feature: string) => {
    if (!user) {
      console.warn('⚠️ [AdGate] consumeAd called with no user! Free use will NOT be persisted to Firestore. This is a bug.')
      return
    }

    let updatedFields: Partial<UserUsage> = {}

    if (feature === 'goal_creation' && !usage.freeGoalUsed) {
      updatedFields.freeGoalUsed = true
      console.log('🔥 [AdGate] consumeAd(goal_creation): Burning free goal use')
    } else if (feature === 'affordability_checker' && !usage.freeAffordabilityUsed) {
      updatedFields.freeAffordabilityUsed = true
      console.log('🔥 [AdGate] consumeAd(affordability_checker): Burning free affordability use')
    } else if (feature === 'savings_plan' && !usage.freePlanningUsed) {
      updatedFields.freePlanningUsed = true
      console.log('🔥 [AdGate] consumeAd(savings_plan): Burning free planning use')
    } else {
      console.log(`🔒 [AdGate] consumeAd(${feature}): Free use already consumed, resetting session unlock`)
    }

    if (Object.keys(updatedFields).length > 0) {
      try {
        console.log('🔥 [AdGate] consumeAd: Writing to Firestore:', JSON.stringify(updatedFields))
        await setUserUsage(user.uid, updatedFields)
        setUsage(prev => ({ ...prev, ...updatedFields }))
        console.log('✅ [AdGate] consumeAd: Firestore write successful, local state updated')
      } catch (e) {
        console.error('❌ [AdGate] consumeAd: Firestore write FAILED! Updating local state anyway to prevent re-use in this session:', e)
        // Even if Firestore write fails, update local state to prevent
        // unlimited uses in the current session. The write will need to
        // succeed on next app load.
        setUsage(prev => ({ ...prev, ...updatedFields }))
        showToast('Could not save your usage. Please check your connection.', 'error')
      }
    }

    // Reset session unlock for subsequent triggers
    setSessionUnlocked(prev => ({ ...prev, [feature]: false }))
    console.log(`🔒 [AdGate] consumeAd(${feature}): Session unlock reset to false`)
  }, [user, usage, showToast])

  // Handles ad completion
  const handleAdFinished = useCallback(async () => {
    setModalOpen(false)
    const feature = modalFeature

    console.log(`✅ [AdGate] Ad completed for ${feature}, unlocking session`)

    if (user) {
      await logAdEvent(user.uid, 'ad_completed', feature)
      await logAdEvent(user.uid, 'feature_unlocked', feature)
    }

    setSessionUnlocked(prev => ({ ...prev, [feature]: true }))
    console.log(`🔓 [AdGate] Session unlocked for ${feature}`)
    showToast(`Feature unlocked successfully!`, 'success')

    if (modalResolve) {
      modalResolve(true)
    }
  }, [user, modalFeature, modalResolve, showToast])

  // Handles closing the modal early (ad cancelled)
  const handleAdCancelled = useCallback(() => {
    setModalOpen(false)
    console.log(`❌ [AdGate] Ad cancelled for ${modalFeature}`)
    if (user) {
      logAdEvent(user.uid, 'ad_failed', modalFeature)
    }
    showToast('Ad was closed early. Feature remains locked.', 'error')
    if (modalResolve) {
      modalResolve(false)
    }
  }, [user, modalFeature, modalResolve, showToast])

  return (
    <AdContext.Provider
      value={{
        watchAd,
        isUnlocked,
        consumeAd,
        adsWatchedToday: 0, // Legacy fallback for compatibility
        expenseUnlocked: true, // Expenses always unlocked
        usageLoading: !usageLoaded
      }}
    >
      {children}
      {modalOpen && (
        <RewardedAdModal
          feature={modalFeature}
          onComplete={handleAdFinished}
          onClose={handleAdCancelled}
        />
      )}
    </AdContext.Provider>
  )
}

export function useAd() {
  const ctx = useContext(AdContext)
  if (!ctx) throw new Error('useAd must be used within AdProvider')
  return ctx
}
