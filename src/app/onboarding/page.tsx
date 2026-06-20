'use client'
// src/app/onboarding/page.tsx
// ─── FIRST-TIME ONBOARDING ──────────────────────────────────────────────────
// Shown once after signup. 3 quick steps: income → first goal → first expense.
// Goal: user understands GoalFlow in under 2 minutes.

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { setIncome, createGoal, createExpense, getGoals } from '@/lib/db'
import { calculateGoalImpact, getImpactMessage } from '@/lib/goalImpact'
import { friendlyError } from '@/lib/errors'
import { trackGoalCreated, trackExpenseAdded, trackOnboardingCompleted } from '@/lib/analytics'
import { format } from 'date-fns'
import { TrendingUp, Wallet, Target, Receipt, ArrowRight, Check, Zap } from 'lucide-react'
import type { Goal, GoalCategory, ExpenseCategory, Expense } from '@/types'

const SUGGESTED_GOALS: { label: string; category: GoalCategory; emoji: string; color: string; target: number; monthly: number }[] = [
  { label: 'Emergency Fund', category: 'emergency_fund', emoji: '🛡️', color: '#f97316', target: 50000, monthly: 5000 },
  { label: 'Laptop', category: 'laptop', emoji: '💻', color: '#6366f1', target: 60000, monthly: 5000 },
  { label: 'Education', category: 'education', emoji: '📚', color: '#06b6d4', target: 30000, monthly: 3000 },
  { label: 'Investment', category: 'investment', emoji: '📈', color: '#8b5cf6', target: 40000, monthly: 4000 },
]

const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string; emoji: string }[] = [
  { value: 'food', label: 'Food', emoji: '🍽️' },
  { value: 'travel', label: 'Travel', emoji: '🚌' },
  { value: 'shopping', label: 'Shopping', emoji: '🛍️' },
  { value: 'entertainment', label: 'Fun', emoji: '🎮' },
  { value: 'education', label: 'Education', emoji: '📚' },
  { value: 'health', label: 'Health', emoji: '💊' },
  { value: 'other', label: 'Other', emoji: '💸' },
]

const TOTAL_STEPS = 3

export default function OnboardingPage() {
  const { user, loading: authLoading } = useAuth()
  const { showToast } = useToast()
  const router = useRouter()

  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)

  // Step 1: income
  const [income, setIncomeValue] = useState('')

  // Step 2: first goal
  const [selectedGoal, setSelectedGoal] = useState<typeof SUGGESTED_GOALS[number] | null>(null)
  const [goalTarget, setGoalTarget] = useState('')
  const [goalMonthly, setGoalMonthly] = useState('')
  const [createdGoal, setCreatedGoal] = useState<Goal | null>(null)

  // Step 3: first expense
  const [expenseAmount, setExpenseAmount] = useState('')
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('food')
  const [impactPreview, setImpactPreview] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login')
  }, [user, authLoading, router])

  function selectGoal(g: typeof SUGGESTED_GOALS[number]) {
    setSelectedGoal(g)
    setGoalTarget(String(g.target))
    setGoalMonthly(String(g.monthly))
  }

  async function handleStep1Next() {
    if (!user) return
    const incomeNum = Number(income)
    if (!incomeNum || incomeNum <= 0) {
      showToast('Please enter your monthly income.', 'error')
      return
    }
    setSaving(true)
    try {
      const currentMonth = format(new Date(), 'yyyy-MM')
      await setIncome(user.uid, currentMonth, incomeNum, 'Salary')
      setStep(2)
    } catch (err) {
      showToast(friendlyError(err, 'Could not save your income.'), 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleStep2Next() {
    if (!user || !selectedGoal) {
      showToast('Pick a goal to get started.', 'error')
      return
    }
    const target = Number(goalTarget)
    if (!target || target <= 0) {
      showToast('Target amount must be greater than 0.', 'error')
      return
    }
    setSaving(true)
    try {
      const data = {
        name: selectedGoal.label,
        targetAmount: target,
        savedAmount: 0,
        targetDate: new Date(Date.now() + 180 * 24 * 3600000).toISOString().split('T')[0],
        priority: 'high' as const,
        monthlyContribution: Number(goalMonthly) || 0,
        category: selectedGoal.category,
        color: selectedGoal.color,
      }
      const id = await createGoal(user.uid, data)
      const goal: Goal = { id, userId: user.uid, ...data, createdAt: new Date(), updatedAt: new Date() }
      setCreatedGoal(goal)
      trackGoalCreated(data.category, data.targetAmount)
      setStep(3)
    } catch (err) {
      showToast(friendlyError(err, 'Could not create your goal.'), 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleStep3Finish(skip = false) {
    if (!user) return
    setSaving(true)
    try {
      if (!skip && expenseAmount && Number(expenseAmount) > 0) {
        const amount = Number(expenseAmount)
        const goals = createdGoal ? [createdGoal] : await getGoals(user.uid)
        const expenseData: Omit<Expense, 'id' | 'userId' | 'createdAt'> = {
          amount,
          category: expenseCategory,
          description: '',
          date: new Date().toISOString().split('T')[0],
        }
        const impact = calculateGoalImpact({ ...expenseData, id: '', userId: user.uid, createdAt: new Date() }, goals, [])
        if (impact) {
          expenseData.goalImpact = impact
          if (impact.daysDelayed > 0) {
            setImpactPreview(getImpactMessage(impact, expenseCategory))
          }
        }
        await createExpense(user.uid, expenseData)
        trackExpenseAdded(expenseCategory, amount, impact?.daysDelayed || 0)
      }
      trackOnboardingCompleted(skip ? 2 : 3)

      if (impactPreview && !skip) {
        // Briefly show the impact message before redirecting
        showToast(impactPreview)
        setTimeout(() => router.push('/dashboard'), 1200)
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      showToast(friendlyError(err, 'Could not finish setup.'), 'error')
      setSaving(false)
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center">
        <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center animate-pulse">
          <TrendingUp size={20} className="text-white" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Logo + progress */}
        <div className="flex items-center gap-2 justify-center mb-6">
          <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center">
            <TrendingUp size={18} className="text-white" />
          </div>
          <span className="font-semibold text-xl tracking-tight">GoalFlow</span>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6 px-2">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} className="flex-1 h-1.5 rounded-full overflow-hidden bg-white/8">
              <div
                className={`h-full bg-brand-500 transition-all duration-300 ${i + 1 <= step ? 'w-full' : 'w-0'}`}
              />
            </div>
          ))}
        </div>

        <div className="glass rounded-2xl p-6 sm:p-8">
          {/* ── Step 1: Income ── */}
          {step === 1 && (
            <div className="animate-fade-in">
              <div className="w-12 h-12 bg-brand-500/15 rounded-2xl flex items-center justify-center mb-4">
                <Wallet size={22} className="text-brand-400" />
              </div>
              <h1 className="text-xl font-bold mb-1">What's your monthly income?</h1>
              <p className="text-surface-400 text-sm mb-6">
                We'll use this to show your savings rate and plan your goals.
              </p>
              <label className="block text-xs font-medium text-surface-400 mb-1.5">Monthly income (₹)</label>
              <input
                type="number"
                inputMode="numeric"
                value={income}
                onChange={e => setIncomeValue(e.target.value)}
                placeholder="16000"
                autoFocus
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-2xl font-bold text-surface-50 placeholder:text-surface-600 focus:border-brand-500/50 mb-6"
              />
              <button
                onClick={handleStep1Next}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-colors min-h-[48px]"
              >
                {saving ? 'Saving…' : 'Continue'} <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* ── Step 2: First Goal ── */}
          {step === 2 && (
            <div className="animate-fade-in">
              <div className="w-12 h-12 bg-brand-500/15 rounded-2xl flex items-center justify-center mb-4">
                <Target size={22} className="text-brand-400" />
              </div>
              <h1 className="text-xl font-bold mb-1">Create your first goal</h1>
              <p className="text-surface-400 text-sm mb-6">What are you saving for?</p>

              <div className="grid grid-cols-2 gap-2 mb-5">
                {SUGGESTED_GOALS.map(g => (
                  <button
                    key={g.category}
                    onClick={() => selectGoal(g)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-colors min-h-[80px] ${
                      selectedGoal?.category === g.category
                        ? 'border-brand-500/50 bg-brand-500/10'
                        : 'border-white/8 bg-white/3 hover:bg-white/6'
                    }`}
                  >
                    <span className="text-2xl">{g.emoji}</span>
                    <span className="text-xs text-surface-300 font-medium">{g.label}</span>
                  </button>
                ))}
              </div>

              {selectedGoal && (
                <div className="grid grid-cols-2 gap-3 mb-6 animate-fade-in">
                  <div>
                    <label className="block text-xs font-medium text-surface-400 mb-1.5">Target (₹)</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={goalTarget}
                      onChange={e => setGoalTarget(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-surface-50 focus:border-brand-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-surface-400 mb-1.5">Monthly (₹)</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={goalMonthly}
                      onChange={e => setGoalMonthly(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-surface-50 focus:border-brand-500/50"
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleStep2Next}
                disabled={saving || !selectedGoal}
                className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-colors min-h-[48px]"
              >
                {saving ? 'Creating…' : 'Continue'} <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* ── Step 3: First Expense ── */}
          {step === 3 && (
            <div className="animate-fade-in">
              <div className="w-12 h-12 bg-brand-500/15 rounded-2xl flex items-center justify-center mb-4">
                <Receipt size={22} className="text-brand-400" />
              </div>
              <h1 className="text-xl font-bold mb-1">Log your first expense</h1>
              <p className="text-surface-400 text-sm mb-6">
                See how it affects your "{createdGoal?.name}" goal — this is GoalFlow's superpower.
              </p>

              <label className="block text-xs font-medium text-surface-400 mb-1.5">Amount (₹)</label>
              <input
                type="number"
                inputMode="numeric"
                value={expenseAmount}
                onChange={e => setExpenseAmount(e.target.value)}
                placeholder="500"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-lg font-bold text-surface-50 placeholder:text-surface-600 focus:border-brand-500/50 mb-4"
              />

              <label className="block text-xs font-medium text-surface-400 mb-2">Category</label>
              <div className="grid grid-cols-4 gap-2 mb-6">
                {EXPENSE_CATEGORIES.map(cat => (
                  <button
                    key={cat.value}
                    onClick={() => setExpenseCategory(cat.value)}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center transition-colors min-h-[56px] ${
                      expenseCategory === cat.value
                        ? 'border-brand-500/50 bg-brand-500/10'
                        : 'border-white/8 bg-white/3 hover:bg-white/6'
                    }`}
                  >
                    <span className="text-lg">{cat.emoji}</span>
                    <span className="text-xs text-surface-400">{cat.label}</span>
                  </button>
                ))}
              </div>

              {expenseAmount && Number(expenseAmount) > 0 && (
                <div className="bg-warning-500/8 border border-warning-500/15 rounded-xl p-3 mb-6 flex items-start gap-2">
                  <Zap size={14} className="text-warning-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-warning-300">
                    We'll calculate exactly how this affects your goal timeline.
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => handleStep3Finish(true)}
                  disabled={saving}
                  className="flex-1 bg-white/5 hover:bg-white/8 border border-white/10 text-surface-300 py-3.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-60 min-h-[48px]"
                >
                  Skip
                </button>
                <button
                  onClick={() => handleStep3Finish(false)}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-colors min-h-[48px]"
                >
                  {saving ? 'Finishing…' : <>Finish <Check size={16} /></>}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-surface-600 mt-4">
          Step {step} of {TOTAL_STEPS}
        </p>
      </div>
    </div>
  )
}
