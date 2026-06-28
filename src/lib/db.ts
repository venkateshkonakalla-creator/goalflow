// src/lib/db.ts
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, getDoc, query, where,
  serverTimestamp, setDoc
} from 'firebase/firestore'
import { db } from './firebase'
import type { Goal, Expense, Income, Allocation, MonthlyPlanRecord, MonthlySummary, PendingContribution } from '@/types'

// ─── GOALS ────────────────────────────────────────────────────────────────────
export async function createGoal(userId: string, data: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) {
  const ref = await addDoc(collection(db, 'goals'), {
    ...data,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function getGoals(userId: string): Promise<Goal[]> {
  try {
    const q = query(
      collection(db, 'goals'),
      where('userId', '==', userId)
    )

    const snap = await getDocs(q)
    
    const results = snap.docs.map(d => {
      const data = d.data()
      return {
        id: d.id,
        ...data,
      } as Goal
    })
    
    return results
  } catch (error) {
    console.error('❌ [getGoals] Error fetching goals:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      code: (error as any)?.code,
      name: (error as any)?.name,
    })
    throw error // Re-throw to see actual error
  }
}

export async function updateGoal(goalId: string, data: Partial<Goal>) {
  await updateDoc(doc(db, 'goals', goalId), { ...data, updatedAt: serverTimestamp() })
}

export async function deleteGoal(goalId: string) {
  await deleteDoc(doc(db, 'goals', goalId))
}

// ─── EXPENSES ─────────────────────────────────────────────────────────────────
export async function createExpense(userId: string, data: Omit<Expense, 'id' | 'userId' | 'createdAt'>) {
  const ref = await addDoc(collection(db, 'expenses'), {
    ...data,
    userId,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function createExpensesBatch(userId: string, data: Array<Omit<Expense, 'id' | 'userId' | 'createdAt'>>) {
  const refs = await Promise.all(data.map(item => addDoc(collection(db, 'expenses'), {
    ...item,
    userId,
    createdAt: serverTimestamp(),
  })))
  return refs.map(ref => ref.id)
}

export async function getExpenses(userId: string, month?: string): Promise<Expense[]> {
  try {
    const q = query(collection(db, 'expenses'), where('userId', '==', userId))
    const snap = await getDocs(q)
    const expenses = snap.docs.map(d => ({ id: d.id, ...d.data() } as Expense))
    // Sort in-memory descending by date to avoid requiring a Firestore composite index
    expenses.sort((a, b) => b.date.localeCompare(a.date))
    if (month) return expenses.filter(e => e.date.startsWith(month))
    return expenses
  } catch (error) {
    console.error('❌ [getExpenses] Error fetching expenses:', error)
    console.error('⚠️ [getExpenses] Error details:', {
      message: error instanceof Error ? error.message : String(error),
      code: (error as any)?.code,
      name: (error as any)?.name,
    })
    throw error // Re-throw to see actual error
  }
}

export async function deleteExpense(expenseId: string) {
  await deleteDoc(doc(db, 'expenses', expenseId))
}

export async function updateExpense(expenseId: string, data: Partial<Omit<Expense, 'id' | 'userId' | 'createdAt'>>) {
  await updateDoc(doc(db, 'expenses', expenseId), { ...data })
}

// ─── INCOME ───────────────────────────────────────────────────────────────────
export async function setIncome(userId: string, month: string, amount: number, source: string) {
  const id = `${userId}_${month}`
  await setDoc(doc(db, 'income', id), {
    userId, month, amount, source,
    updatedAt: serverTimestamp(),
  }, { merge: true })
}

export async function getIncome(userId: string, month: string): Promise<Income | null> {
  try {
    const id = `${userId}_${month}`
    const snap = await getDoc(doc(db, 'income', id))
    if (!snap.exists()) {
      return null
    }
    return { id: snap.id, ...snap.data() } as Income
  } catch (error) {
    console.error('❌ [getIncome] Error fetching income:', error)
    console.error('⚠️ [getIncome] Error details:', {
      message: error instanceof Error ? error.message : String(error),
      code: (error as any)?.code,
    })
    throw error
  }
}

// ─── ALLOCATIONS ──────────────────────────────────────────────────────────────
export async function saveAllocations(userId: string, month: string, allocations: Omit<Allocation, 'id' | 'userId' | 'month' | 'createdAt'>[]) {
  // Delete existing allocations for this month first
  const q = query(collection(db, 'allocations'), where('userId', '==', userId), where('month', '==', month))
  const snap = await getDocs(q)
  await Promise.all(snap.docs.map(d => deleteDoc(d.ref)))

  // Create new allocations
  await Promise.all(allocations.map(a =>
    addDoc(collection(db, 'allocations'), {
      ...a, userId, month, createdAt: serverTimestamp(),
    })
  ))
}

export async function getAllocations(userId: string, month: string): Promise<Allocation[]> {
  try {
    const q = query(collection(db, 'allocations'), where('userId', '==', userId), where('month', '==', month))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Allocation))
  } catch (error) {
    console.error('❌ [getAllocations] Error fetching allocations:', error)
    console.error('⚠️ [getAllocations] Error details:', {
      message: error instanceof Error ? error.message : String(error),
      code: (error as any)?.code,
      name: (error as any)?.name,
    })
    throw error // Re-throw to see actual error
  }
}

// ─── MONTHLY PLAN SNAPSHOTS ─────────────────────────────────────────────────
export async function saveMonthlyPlan(userId: string, month: string, data: { income: number; allocations: Omit<Allocation, 'id' | 'userId' | 'month' | 'createdAt'>[]; totalAllocated: number; remaining: number; mode: 'goal' | 'custom' }) {
  const id = `${userId}_${month}`
  await setDoc(doc(db, 'monthly_plans', id), {
    userId,
    month,
    income: data.income,
    allocations: data.allocations,
    totalAllocated: data.totalAllocated,
    remaining: data.remaining,
    mode: data.mode,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true })
}

export async function getMonthlyPlan(userId: string, month: string): Promise<MonthlyPlanRecord | null> {
  const id = `${userId}_${month}`
  const snap = await getDoc(doc(db, 'monthly_plans', id))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as MonthlyPlanRecord
}

// ─── MONTHLY SUMMARIES ──────────────────────────────────────────────────────
export async function saveMonthlySummary(userId: string, month: string, data: Omit<MonthlySummary, 'id' | 'userId' | 'month' | 'createdAt' | 'updatedAt'>) {
  const id = `${userId}_${month}`
  await setDoc(doc(db, 'monthly_summaries', id), {
    userId,
    month,
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true })
}

export async function getMonthlySummaries(userId: string): Promise<MonthlySummary[]> {
  const q = query(collection(db, 'monthly_summaries'), where('userId', '==', userId))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as MonthlySummary))
}

// ─── PENDING CONTRIBUTIONS ────────────────────────────────────────────────
export async function createPendingContribution(userId: string, data: Omit<PendingContribution, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) {
  const ref = await addDoc(collection(db, 'pending_contributions'), {
    ...data,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function getPendingContributions(userId: string, month?: string): Promise<PendingContribution[]> {
  const q = query(collection(db, 'pending_contributions'), where('userId', '==', userId))
  const snap = await getDocs(q)
  const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as PendingContribution))
  return month ? items.filter(item => item.month === month) : items
}

export async function updatePendingContribution(pendingId: string, data: Partial<PendingContribution>) {
  await updateDoc(doc(db, 'pending_contributions', pendingId), { ...data, updatedAt: serverTimestamp() })
}

export async function deletePendingContribution(pendingId: string) {
  await deleteDoc(doc(db, 'pending_contributions', pendingId))
}

// ─── USER MONETIZATION USAGE & CONTACT ──────────────────────────────────────────
export interface UserUsage {
  freeGoalUsed: boolean
  freeAffordabilityUsed: boolean
  freePlanningUsed: boolean
}

export async function getUserUsage(userId: string): Promise<UserUsage> {
  try {
    console.log('🔒 [getUserUsage] Reading usage doc for user:', userId)
    const snap = await getDoc(doc(db, 'users', userId, 'usage', 'state'))
    if (!snap.exists()) {
      console.log('🔒 [getUserUsage] No usage doc found — first-time user, all free tiers available')
      return {
        freeGoalUsed: false,
        freeAffordabilityUsed: false,
        freePlanningUsed: false
      }
    }
    const data = snap.data()
    const usage: UserUsage = {
      freeGoalUsed: !!data.freeGoalUsed,
      freeAffordabilityUsed: !!data.freeAffordabilityUsed,
      freePlanningUsed: !!data.freePlanningUsed
    }
    console.log('🔒 [getUserUsage] Usage loaded from Firestore:', JSON.stringify(usage))
    return usage
  } catch (error) {
    console.error('❌ [getUserUsage] Firestore read FAILED — re-throwing to prevent free access bypass:', error)
    // CRITICAL: Do NOT return defaults here. Returning {freeXxxUsed: false}
    // on error would silently grant free access on every Firestore failure.
    throw error
  }
}

export async function updateUserUsage(userId: string, data: Partial<UserUsage>) {
  try {
    console.log('🔥 [updateUserUsage] Writing usage for user:', userId, JSON.stringify(data))
    await setDoc(doc(db, 'users', userId, 'usage', 'state'), data, { merge: true })
    console.log('✅ [updateUserUsage] Firestore write successful for user:', userId)
  } catch (error) {
    console.error('❌ [updateUserUsage] Firestore write FAILED for user:', userId, error)
    throw error
  }
}

export async function saveContactMessage(userId: string | null, data: { name: string; email: string; message: string }) {
  try {
    const ref = await addDoc(collection(db, 'contact_messages'), {
      ...data,
      userId,
      createdAt: serverTimestamp(),
    })
    return ref.id
  } catch (error) {
    console.error('❌ [saveContactMessage] Error saving contact message:', error)
    throw error
  }
}

