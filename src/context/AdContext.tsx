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

  // Session-based unlocks (after watching an ad)
  const [sessionUnlocked, setSessionUnlocked] = useState<Record<string, boolean>>({})

  // Fetch usage stats when user changes
  useEffect(() => {
    if (!user) {
      setUsage({
        freeGoalUsed: false,
        freeAffordabilityUsed: false,
        freePlanningUsed: false
      })
      setSessionUnlocked({})
      return
    }

    const fetchUsage = async () => {
      try {
        const u = await getUserUsage(user.uid)
        setUsage(u)
      } catch (e) {
        console.error('❌ [AdProvider] Error fetching usage:', e)
      }
    }

    fetchUsage()
  }, [user])

  // Helper to check if a feature is unlocked (first-use free OR ad watched in this session)
  const isUnlocked = useCallback((feature: string): boolean => {
    if (feature === 'expense_tracking') {
      return true // Expenses are always free
    }

    if (feature === 'goal_creation' && !usage.freeGoalUsed) {
      return true
    }

    if (feature === 'affordability_checker' && !usage.freeAffordabilityUsed) {
      return true
    }

    if (feature === 'savings_plan' && !usage.freePlanningUsed) {
      return true
    }

    return !!sessionUnlocked[feature]
  }, [usage, sessionUnlocked])

  // Watch ad if subsequent use
  const watchAd = useCallback((feature: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (feature === 'expense_tracking') {
        resolve(true)
        return
      }

      // If it's the first use, bypass ad showing
      if (feature === 'goal_creation' && !usage.freeGoalUsed) {
        resolve(true)
        return
      }
      if (feature === 'affordability_checker' && !usage.freeAffordabilityUsed) {
        resolve(true)
        return
      }
      if (feature === 'savings_plan' && !usage.freePlanningUsed) {
        resolve(true)
        return
      }

      // Otherwise, open rewarded modal
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
    if (!user) return

    let updatedFields: Partial<UserUsage> = {}

    if (feature === 'goal_creation' && !usage.freeGoalUsed) {
      updatedFields.freeGoalUsed = true
    } else if (feature === 'affordability_checker' && !usage.freeAffordabilityUsed) {
      updatedFields.freeAffordabilityUsed = true
    } else if (feature === 'savings_plan' && !usage.freePlanningUsed) {
      updatedFields.freePlanningUsed = true
    }

    if (Object.keys(updatedFields).length > 0) {
      try {
        await setUserUsage(user.uid, updatedFields)
        setUsage(prev => ({ ...prev, ...updatedFields }))
      } catch (e) {
        console.error('❌ [AdProvider] Error updating usage:', e)
      }
    }

    // Reset session unlock for subsequent triggers
    setSessionUnlocked(prev => ({ ...prev, [feature]: false }))
  }, [user, usage])

  // Handles ad completion
  const handleAdFinished = useCallback(async () => {
    setModalOpen(false)
    const feature = modalFeature

    if (user) {
      await logAdEvent(user.uid, 'ad_completed', feature)
      await logAdEvent(user.uid, 'feature_unlocked', feature)
    }

    setSessionUnlocked(prev => ({ ...prev, [feature]: true }))
    showToast(`Feature unlocked successfully!`, 'success')

    if (modalResolve) {
      modalResolve(true)
    }
  }, [user, modalFeature, modalResolve, showToast])

  // Handles closing the modal early (ad cancelled)
  const handleAdCancelled = useCallback(() => {
    setModalOpen(false)
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
        expenseUnlocked: true // Expenses always unlocked
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

