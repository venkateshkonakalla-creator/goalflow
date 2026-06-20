'use client'
// src/app/dashboard/page.tsx
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { getGoals, getExpenses, getIncome, getAllocations } from '@/lib/db'
import { calculateSavingsRate, calculateGoalImpact, getDashboardStatus, forecastDateLabel } from '@/lib/goalImpact'
import { friendlyError } from '@/lib/errors'
import { format } from 'date-fns'
import {
  TrendingUp, TrendingDown, Target, Wallet, Zap,
  ArrowUpRight, Plus, ChevronRight, AlertCircle, Calculator
} from 'lucide-react'
import Link from 'next/link'
import type { Goal, Expense, Income, Allocation } from '@/types'

const CATEGORY_EMOJI: Record<string, string> = {
  food: '🍽️', travel: '🚌', shopping: '🛍️', entertainment: '🎮',
  education: '📚', health: '💊', other: '💸',
}
const CATEGORY_COLORS: Record<string, string> = {
  food: 'bg-orange-400', travel: 'bg-blue-400', shopping: 'bg-pink-400',
  entertainment: 'bg-purple-400', education: 'bg-cyan-400', health: 'bg-green-400', other: 'bg-surface-400',
}

const GOAL_COLORS = ['#6366f1', '#f97316', '#22c55e', '#06b6d4', '#8b5cf6', '#ec4899']

const STATUS_STYLES: Record<string, { border: string; bg: string; text: string }> = {
  on_track: { border: 'border-success-500/20', bg: 'bg-success-500/8', text: 'text-success-400' },
  behind:   { border: 'border-warning-500/20', bg: 'bg-warning-500/8', text: 'text-warning-400' },
  critical: { border: 'border-danger-500/20',  bg: 'bg-danger-500/8',  text: 'text-danger-400' },
}

function StatCard({ label, value, sub, icon: Icon, color }: { label: string; value: string | number; sub?: string; icon: any; color: string }) {
  return (
    <div className="glass rounded-2xl p-4 sm:p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs sm:text-sm text-surface-400">{label}</p>
        <div className={`w-8 h-8 rounded-lg ${color} bg-opacity-15 flex items-center justify-center flex-shrink-0`}>
          <Icon size={16} className={color.replace('bg-', 'text-').replace('/15', '')} />
        </div>
      </div>
      <p className="text-xl sm:text-2xl font-bold text-surface-50 mb-1 truncate">{value}</p>
      {sub && <p className="text-xs text-surface-500 truncate">{sub}</p>}
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [goals, setGoals] = useState<Goal[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [income, setIncome] = useState<Income | null>(null)
  const [allocations, setAllocations] = useState<Allocation[]>([])
  const [loading, setLoading] = useState(true)

  const currentMonth = format(new Date(), 'yyyy-MM')

  useEffect(() => {
    if (!user) return
    console.log('📊 [Dashboard] Loading data for user:', user.uid)
    
    const fetchGoals = getGoals(user.uid).catch(err => {
      console.error('❌ [Dashboard] Error loading goals:', err)
      showToast(friendlyError(err, 'Could not load goals.'), 'error')
      return [] as Goal[]
    })
    const fetchExpenses = getExpenses(user.uid, currentMonth).catch(err => {
      console.error('❌ [Dashboard] Error loading expenses:', err)
      showToast(friendlyError(err, 'Could not load expenses.'), 'error')
      return [] as Expense[]
    })
    const fetchIncome = getIncome(user.uid, currentMonth).catch(err => {
      console.error('❌ [Dashboard] Error loading income:', err)
      showToast(friendlyError(err, 'Could not load income.'), 'error')
      return null
    })
    const fetchAllocations = getAllocations(user.uid, currentMonth).catch(err => {
      console.error('❌ [Dashboard] Error loading allocations:', err)
      showToast(friendlyError(err, 'Could not load allocations.'), 'error')
      return [] as Allocation[]
    })

    Promise.all([fetchGoals, fetchExpenses, fetchIncome, fetchAllocations])
      .then(([g, e, inc, alloc]) => {
        console.log('📊 [Dashboard] Data loaded successfully. Goals:', g.length, 'Expenses:', e.length)
        setGoals(g)
        setExpenses(e)
        setIncome(inc)
        setAllocations(alloc)
      }).catch(err => {
        console.error('❌ [Dashboard] Promise.all unexpected error:', err)
      })
      .finally(() => setLoading(false))
  }, [user, currentMonth]) // eslint-disable-line react-hooks/exhaustive-deps

  const monthlyIncome = income?.amount || 0
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const remaining = monthlyIncome - totalExpenses
  const savingsRate = calculateSavingsRate(monthlyIncome, totalExpenses)

  // Recent expenses with impact
  const recentExpenses = expenses.slice(0, 5)

  // Latest impact messages
  const latestImpacts = recentExpenses
    .map(e => {
      const impact = calculateGoalImpact(e, goals, allocations)
      return impact && impact.daysDelayed > 0 ? { expense: e, impact } : null
    })
    .filter((x): x is { expense: Expense; impact: NonNullable<ReturnType<typeof calculateGoalImpact>> } => x !== null)
    .slice(0, 2)

  const status = goals.length > 0 || monthlyIncome > 0
    ? getDashboardStatus(goals, monthlyIncome, totalExpenses, expenses)
    : null
  const statusStyle = status ? STATUS_STYLES[status.type] : null

  if (loading) {
    return (
      <div className="p-4 sm:p-6 md:p-8">
        <div className="h-20 glass rounded-2xl mb-6 shimmer" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass rounded-2xl p-5 h-28 shimmer" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl">
      {/* ── Header ── */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
          {user?.displayName?.split(' ')[0] || 'there'} 👋
        </h1>
        <p className="text-surface-400 text-sm mt-1">{format(new Date(), 'MMMM yyyy')} overview</p>
      </div>

      {/* ── Status Card ── */}
      {status && statusStyle && (
        <div className={`glass rounded-2xl p-4 sm:p-5 mb-6 flex items-start gap-3 border ${statusStyle.border} ${statusStyle.bg}`}>
          <span className="text-2xl flex-shrink-0 leading-none">{status.icon}</span>
          <div>
            <p className={`text-sm font-semibold mb-0.5 ${statusStyle.text}`}>{status.title}</p>
            <p className="text-sm text-surface-300 leading-relaxed">{status.message}</p>
          </div>
        </div>
      )}

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <StatCard
          label="Monthly Income"
          value={monthlyIncome ? `₹${monthlyIncome.toLocaleString('en-IN')}` : '—'}
          sub={income?.source || 'Not set'}
          icon={Wallet}
          color="bg-brand-400"
        />
        <StatCard
          label="Savings Rate"
          value={`${savingsRate}%`}
          sub={savingsRate >= 30 ? '🎉 Great job!' : 'Aim for 30%+'}
          icon={TrendingUp}
          color="bg-success-400"
        />
        <StatCard
          label="Active Goals"
          value={goals.filter(g => g.savedAmount < g.targetAmount).length}
          sub={`${goals.length} total goals`}
          icon={Target}
          color="bg-warning-400"
        />
        <StatCard
          label="Money Remaining"
          value={`₹${Math.max(0, remaining).toLocaleString('en-IN')}`}
          sub="This month"
          icon={remaining >= 0 ? TrendingUp : TrendingDown}
          color={remaining >= 0 ? 'bg-success-400' : 'bg-danger-400'}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ── Goals Progress ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Goal Impact Alerts */}
          {latestImpacts.length > 0 && (
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Zap size={16} className="text-warning-400" />
                <h2 className="text-sm font-semibold text-surface-200">Goal Impact</h2>
                <Link href="/dashboard/impact" className="text-xs text-brand-400 hover:text-brand-300 ml-auto flex items-center gap-1">
                  View all <ChevronRight size={12} />
                </Link>
              </div>
              <div className="space-y-3">
                {latestImpacts.map(item => (
                  <div
                    key={item.expense.id}
                    className="bg-warning-500/8 border border-warning-500/15 rounded-xl p-4"
                  >
                    <p className="text-sm text-surface-300 leading-relaxed">
                      You spent{' '}
                      <span className="text-surface-50 font-medium">₹{item.expense.amount.toLocaleString('en-IN')}</span>
                      {' '}on {item.expense.category}.{' '}
                      <span className="text-warning-300 font-medium">
                        Your "{item.impact.goalName}" goal is now delayed by {item.impact.daysDelayed} day{item.impact.daysDelayed !== 1 ? 's' : ''}.
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Goals */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-surface-200">Your Goals</h2>
              <Link href="/dashboard/goals" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
                View all <ChevronRight size={12} />
              </Link>
            </div>

            {goals.length === 0 ? (
              <div className="text-center py-8">
                <Target size={32} className="text-surface-600 mx-auto mb-3" />
                <p className="text-surface-400 text-sm mb-4">No goals yet. Create your first goal.</p>
                <Link
                  href="/dashboard/goals"
                  className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm px-4 py-2.5 rounded-xl transition-colors min-h-[44px]"
                >
                  <Plus size={14} /> Add goal
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {goals.slice(0, 4).map((goal, i) => {
                  const pct = Math.min(100, Math.round((goal.savedAmount / goal.targetAmount) * 100))
                  const color = GOAL_COLORS[i % GOAL_COLORS.length]
                  return (
                    <div key={goal.id}>
                      <div className="flex items-start justify-between mb-2 gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-surface-200 truncate">{goal.name}</p>
                          <p className="text-xs text-surface-500 mt-0.5">
                            ₹{goal.savedAmount.toLocaleString('en-IN')} / ₹{goal.targetAmount.toLocaleString('en-IN')}
                            {goal.savedAmount < goal.targetAmount && (
                              <span className="text-surface-600"> · Est. {forecastDateLabel(goal)}</span>
                            )}
                          </p>
                        </div>
                        <span className="text-xs font-semibold text-surface-400 flex-shrink-0">{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full progress-bar"
                          style={{ width: `${pct}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Recent Expenses */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-surface-200">Recent Expenses</h2>
              <Link href="/dashboard/expenses" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
                View all <ChevronRight size={12} />
              </Link>
            </div>

            {recentExpenses.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-surface-500 text-sm">No expenses this month.</p>
                <Link href="/dashboard/expenses" className="text-brand-400 text-sm hover:text-brand-300 mt-2 inline-block">
                  Add your first expense →
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recentExpenses.map(expense => (
                  <div key={expense.id} className="flex items-center gap-3 py-2">
                    <div className={`w-8 h-8 rounded-lg ${CATEGORY_COLORS[expense.category] || 'bg-surface-600'} bg-opacity-20 flex items-center justify-center flex-shrink-0`}>
                      <span className="text-xs">{CATEGORY_EMOJI[expense.category] || '💸'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-surface-200 truncate">{expense.description || expense.category}</p>
                      <p className="text-xs text-surface-500">{format(new Date(expense.date), 'dd MMM')}</p>
                    </div>
                    <span className="text-sm font-medium text-surface-200 flex-shrink-0">
                      ₹{expense.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <div className="space-y-4 sm:space-y-6">
          {/* Monthly allocation breakdown */}
          <div className="glass rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-surface-200 mb-4">Monthly Allocation</h2>
            {!monthlyIncome ? (
              <div className="text-center py-4">
                <p className="text-surface-500 text-xs mb-3">Set your income to start planning.</p>
                <Link href="/dashboard/planning" className="text-brand-400 text-xs hover:text-brand-300">
                  Set up planning →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {allocations.slice(0, 5).map((alloc, i) => {
                  const pct = Math.round((alloc.amount / monthlyIncome) * 100)
                  return (
                    <div key={alloc.id}>
                      <div className="flex justify-between text-xs text-surface-400 mb-1">
                        <span className="truncate flex-1">{alloc.goalName}</span>
                        <span className="ml-2 flex-shrink-0">₹{alloc.amount.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="h-1 bg-white/8 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: GOAL_COLORS[i % GOAL_COLORS.length] }}
                        />
                      </div>
                    </div>
                  )
                })}
                {allocations.length === 0 && (
                  <Link href="/dashboard/planning" className="text-brand-400 text-xs hover:text-brand-300 block">
                    Create a monthly plan →
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/dashboard/expenses"
              className="glass rounded-2xl p-4 flex flex-col gap-2 hover:bg-white/6 transition-colors group cursor-pointer"
            >
              <div className="w-9 h-9 bg-brand-500/15 rounded-xl flex items-center justify-center">
                <Plus size={18} className="text-brand-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-surface-200">Log expense</p>
                <p className="text-xs text-surface-500">Track spending</p>
              </div>
            </Link>
            <Link
              href="/dashboard/afford"
              className="glass rounded-2xl p-4 flex flex-col gap-2 hover:bg-white/6 transition-colors group cursor-pointer"
            >
              <div className="w-9 h-9 bg-success-500/15 rounded-xl flex items-center justify-center">
                <Calculator size={18} className="text-success-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-surface-200">Can I afford?</p>
                <p className="text-xs text-surface-500">Check impact</p>
              </div>
            </Link>
          </div>

          {/* Tips */}
          <div className="glass rounded-2xl p-5 border-brand-500/15">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle size={14} className="text-brand-400" />
              <p className="text-xs font-medium text-brand-300">Pro Tip</p>
            </div>
            <p className="text-xs text-surface-400 leading-relaxed">
              Allocate your salary on the 1st of every month. People who plan first spend 23% less.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
