// src/lib/db.ts
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, getDoc, query, where, orderBy,
  serverTimestamp, setDoc
} from 'firebase/firestore'
import { db } from './firebase'
import type { Goal, Expense, Income, Allocation } from '@/types'

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
    console.log('🔍 [getGoals] Starting fetch for userId:', userId)
    const q = query(
      collection(db, 'goals'),
      where('userId', '==', userId)
    )

    const snap = await getDocs(q)
    console.log('✅ [getGoals] Successfully fetched', snap.docs.length, 'goals')
    
    const results = snap.docs.map(d => {
      const data = d.data()
      console.log('📄 [getGoals] Document:', d.id, data)
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

export async function getExpenses(userId: string, month?: string): Promise<Expense[]> {
  try {
    console.log('🔍 [getExpenses] Starting fetch for userId:', userId, 'month:', month)
    let q = query(collection(db, 'expenses'), where('userId', '==', userId))
    const snap = await getDocs(q)
    console.log('✅ [getExpenses] Successfully fetched', snap.docs.length, 'expenses')
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
    console.log('💰 [getIncome] Fetching for userId:', userId, 'month:', month)
    const id = `${userId}_${month}`
    const snap = await getDoc(doc(db, 'income', id))
    if (!snap.exists()) {
      console.log('💰 [getIncome] No income document found for', id)
      return null
    }
    console.log('✅ [getIncome] Income found:', snap.data())
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
    console.log('🔍 [getAllocations] Starting fetch for userId:', userId, 'month:', month)
    const q = query(collection(db, 'allocations'), where('userId', '==', userId), where('month', '==', month))
    const snap = await getDocs(q)
    console.log('✅ [getAllocations] Successfully fetched', snap.docs.length, 'allocations')
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
