// src/lib/analytics.ts
// ─── ANALYTICS TRACKING ─────────────────────────────────────────────────────────
// Thin wrapper around Firebase Analytics (GA4). All calls are safe to use
// during SSR and when analytics isn't configured — they simply no-op.
//
// Tracked events power the following dashboard metrics:
//  - signup conversion rate
//  - goals created per user
//  - expenses logged per user
//  - affordability calculator engagement
//  - goal completion rate

import { logEvent } from 'firebase/analytics'
import { getAnalyticsInstance } from './firebase'

async function track(eventName: string, params?: Record<string, unknown>) {
  try {
    const analytics = await getAnalyticsInstance()
    if (!analytics) return
    logEvent(analytics, eventName, params)
  } catch {
    // Analytics failures should never break the app.
  }
}

/** User created a new account (email or Google). */
export function trackSignup(method: 'email' | 'google') {
  track('sign_up', { method })
}

/** User logged in to an existing account. */
export function trackLogin(method: 'email' | 'google') {
  track('login', { method })
}

/** User created a new financial goal. */
export function trackGoalCreated(category: string, targetAmount: number) {
  track('goal_created', { category, target_amount: targetAmount })
}

/** A goal reached 100% of its target amount. */
export function trackGoalCompleted(category: string, targetAmount: number) {
  track('goal_completed', { category, target_amount: targetAmount })
}

/** User logged a new expense. */
export function trackExpenseAdded(category: string, amount: number, daysDelayed: number) {
  track('expense_added', { category, amount, days_delayed: daysDelayed })
}

/** User ran the "Can I Afford This?" calculator. */
export function trackAffordabilityCheck(amount: number, canAfford: boolean) {
  track('affordability_check', { amount, can_afford: canAfford })
}

/** User completed (or skipped) the first-time onboarding flow. */
export function trackOnboardingCompleted(stepsCompleted: number) {
  track('onboarding_completed', { steps_completed: stepsCompleted })
}

/** Generic page view — call from layout/page effects if deeper funnels are needed. */
export function trackPageView(pageName: string) {
  track('page_view', { page_name: pageName })
}

/** User generated a savings plan. */
export function trackPlanningGenerated(goalId?: string) {
  track('planning_generated', { goal_id: goalId })
}

/** User submitted the contact form. */
export function trackContactSubmitted() {
  track('contact_submitted')
}

/** User started watching a rewarded ad. */
export function trackAdStarted(feature: string) {
  track('ad_started', { feature })
}

/** User successfully completed a rewarded ad. */
export function trackAdCompleted(feature: string) {
  track('ad_completed', { feature })
}

