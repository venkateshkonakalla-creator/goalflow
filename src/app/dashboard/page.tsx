'use client'
// src/app/dashboard/page.tsx
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { getGoals, getExpenses, getIncome, getAllocations, saveMonthlySummary } from '@/lib/db'
import { calculateSavingsRate, calculateGoalImpact, getDashboardStatus, forecastDateLabel } from '@/lib/goalImpact'
import { friendlyError } from '@/lib/errors'
import { format } from 'date-fns'
import {
  TrendingUp, TrendingDown, Target, Wallet, Zap,
  Plus, ChevronRight, AlertCircle, Calculator, Activity, PiggyBank, BadgeCheck
} from 'lucide-react'
import Link from 'next/link'
import type { Goal, Expense, Income, Allocation } from '@/types'
import BannerAd from '@/components/BannerAd'


const CATEGORY_EMOJI: Record<string, string> = {
  food: '🍽️', travel: '🚌', shopping: '🛍️', entertainment: '🎮',
  education: '📚', health: '💊', other: '💸',
}
const CATEGORY_COLORS: Record<string, string> = {
  food: 'bg-orange-400', travel: 'bg-blue-400', shopping: 'bg-pink-400',
  entertainment: 'bg-purple-400', education: 'bg-cyan-400', health: 'bg-green-400', other: 'bg-surface-400',
}

const STATUS_STYLES: Record<string, { border: string; bg: string; text: string }> = {
  on_track: { border: 'border-success-500/20', bg: 'bg-success-500/8', text: 'text-success-400' },
  behind:   { border: 'border-warning-500/20', bg: 'bg-warning-500/8', text: 'text-warning-400' },
  critical: { border: 'border-danger-500/20',  bg: 'bg-danger-500/8',  text: 'text-danger-400' },
}

function getProgressColor(pct: number): string {
  if (pct >= 100) return '#fbbf24' // Gold
  if (pct >= 76)  return '#22c55e' // Green
  if (pct >= 51)  return '#facc15' // Yellow
  if (pct >= 26)  return '#f97316' // Orange
  return '#ef4444'                 // Red
}

function calculateHealthScore(savingsRate: number, goals: Goal[], totalExpenses: number, monthlyIncome: number): {
  score: number; label: string; color: string; description: string
} {
  // Savings Rate: up to 40 points (30%+ = full marks)
  const savingsScore = Math.min(40, Math.round((savingsRate / 30) * 40))

  // Goal Progress: up to 30 points (average completion across goals)
  const totalGoals = goals.length
  const avgProgress = totalGoals > 0
    ? goals.reduce((s, g) => s + Math.min(100, (g.savedAmount / g.targetAmount) * 100), 0) / totalGoals
    : 50
  const goalScore = Math.round((avgProgress / 100) * 30)

  // Expense Ratio: up to 30 points (spending < 60% of income = full marks)
  const expenseRatio = monthlyIncome > 0 ? (totalExpenses / monthlyIncome) : 0.5
  const expenseScore = Math.max(0, Math.round((1 - Math.min(1, expenseRatio / 0.7)) * 30))

  const score = Math.min(100, Math.max(0, savingsScore + goalScore + expenseScore))

  if (score >= 80) return { score, label: 'Excellent', color: '#22c55e',  description: 'Outstanding financial health!' }
  if (score >= 60) return { score, label: 'Good',      color: '#6366f1',  description: 'Solid progress, keep it up.' }
  if (score >= 40) return { score, label: 'Average',   color: '#f97316',  description: 'Room for improvement ahead.' }
  return               { score, label: 'Poor',       color: '#ef4444',  description: 'Focus on savings and reducing expenses.' }
}

function StatCard({ label, value, sub, icon: Icon, color }: { label: string; value: string | number; sub?: string; icon: any; color: string }) {
  return (
    <div className="glass rounded-2xl p-4 sm:p-5 hover:bg-white/5 transition-colors">
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
    const fetchGoals = getGoals(user.uid).catch(err => { showToast(friendlyError(err, 'Could not load goals.'), 'error'); return [] as Goal[] })
    const fetchExpenses = getExpenses(user.uid, currentMonth).catch(err => { showToast(friendlyError(err, 'Could not load expenses.'), 'error'); return [] as Expense[] })
    const fetchIncome = getIncome(user.uid, currentMonth).catch(() => null)
    const fetchAllocations = getAllocations(user.uid, currentMonth).catch(() => [] as Allocation[])

    Promise.all([fetchGoals, fetchExpenses, fetchIncome, fetchAllocations])
      .then(([g, e, inc, alloc]) => {
        setGoals(g); setExpenses(e); setIncome(inc); setAllocations(alloc)
      }).finally(() => setLoading(false))
  }, [user, currentMonth]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!user || !income) return
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
    const totalSaved = goals.reduce((s, g) => s + g.savedAmount, 0)
    const remainingSalary = Math.max(0, (income.amount || 0) - totalExpenses - goals.reduce((s, g) => s + g.monthlyContribution, 0))
    const savingsRate = calculateSavingsRate(income.amount || 0, totalExpenses)
    saveMonthlySummary(user.uid, currentMonth, {
      income: income.amount || 0,
      expenses: totalExpenses,
      saved: totalSaved,
      savingsRate,
      goalContributions: goals.reduce((sum, g) => sum + g.monthlyContribution, 0),
      remainingSalary,
    }).catch(() => undefined)
  }, [user, income, expenses, goals, currentMonth])

  const monthlyIncome  = income?.amount || 0
  const totalExpenses  = expenses.reduce((s, e) => s + e.amount, 0)
  const remaining      = monthlyIncome - totalExpenses
  const savingsRate    = calculateSavingsRate(monthlyIncome, totalExpenses)
  const totalSaved     = goals.reduce((s, g) => s + g.savedAmount, 0)
  const completedGoalContributions = goals.reduce((sum, g) => sum + (g.savedAmount >= g.targetAmount ? g.monthlyContribution : 0), 0)
  const remainingSalary = Math.max(0, monthlyIncome - totalExpenses - completedGoalContributions)

  const recentExpenses  = expenses.slice(0, 5)
  const latestImpacts   = recentExpenses
    .map(e => {
      const impact = calculateGoalImpact(e, goals, allocations)
      return impact && impact.daysDelayed > 0 ? { expense: e, impact } : null
    })
    .filter((x): x is { expense: Expense; impact: NonNullable<ReturnType<typeof calculateGoalImpact>> } => x !== null)
    .slice(0, 2)

  const status      = goals.length > 0 || monthlyIncome > 0 ? getDashboardStatus(goals, monthlyIncome, totalExpenses, expenses) : null
  const statusStyle = status ? STATUS_STYLES[status.type] : null
  const healthData  = calculateHealthScore(savingsRate, goals, totalExpenses, monthlyIncome)

  if (loading) {
    return (
      <div className="p-4 sm:p-6 md:p-8">
        <div className="h-20 glass rounded-2xl mb-6 shimmer" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => <div key={i} className="glass rounded-2xl p-5 h-28 shimmer" />)}
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

      {/* ── Financial Health Score ── */}
      <div className="glass rounded-2xl p-5 sm:p-6 mb-6 border border-white/5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="flex items-center gap-4">
            <div
              className="relative w-20 h-20 flex-shrink-0"
            >
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="40" cy="40" r="34" className="stroke-white/8" strokeWidth="6" fill="transparent" />
                <circle
                  cx="40" cy="40" r="34"
                  strokeWidth="6" fill="transparent"
                  strokeDasharray={2 * Math.PI * 34}
                  strokeDashoffset={2 * Math.PI * 34 * (1 - healthData.score / 100)}
                  strokeLinecap="round"
                  style={{ stroke: healthData.color, transition: 'stroke-dashoffset 1s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-extrabold text-surface-50">{healthData.score}</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-surface-500 uppercase tracking-wider mb-1">Financial Health</p>
              <p className="text-xl font-bold" style={{ color: healthData.color }}>{healthData.label}</p>
              <p className="text-xs text-surface-400 mt-0.5">{healthData.description}</p>
            </div>
          </div>
          <div className="flex-1 grid grid-cols-3 gap-3 sm:ml-4">
            {[
              { label: 'Savings Rate', value: `${savingsRate}%`, color: savingsRate >= 30 ? '#22c55e' : '#f97316' },
              { label: 'Goal Progress', value: goals.length > 0 ? `${Math.round(goals.reduce((s,g) => s + Math.min(100,(g.savedAmount/g.targetAmount)*100),0)/goals.length)}%` : 'N/A', color: '#6366f1' },
              { label: 'Expense Ratio', value: monthlyIncome > 0 ? `${Math.round((totalExpenses / monthlyIncome) * 100)}%` : 'N/A', color: totalExpenses > monthlyIncome * 0.7 ? '#ef4444' : '#22c55e' },
            ].map(stat => (
              <div key={stat.label} className="bg-white/3 rounded-xl p-3 text-center">
                <p className="text-xs text-surface-500 mb-1">{stat.label}</p>
                <p className="text-base font-bold" style={{ color: stat.color }}>{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <StatCard label="Total Goals"      value={goals.length}                                                                icon={Target}      color="bg-brand-400"   sub={`${goals.filter(g=>g.savedAmount>=g.targetAmount).length} completed`} />
        <StatCard label="Total Saved"      value={`₹${totalSaved.toLocaleString('en-IN')}`}                                  icon={PiggyBank}    color="bg-success-400" sub="across all goals" />
        <StatCard label="Monthly Income"   value={monthlyIncome ? `₹${monthlyIncome.toLocaleString('en-IN')}` : '—'}         icon={Wallet}       color="bg-brand-400"   sub={income?.source || 'Not set'} />
        <StatCard label="Monthly Expenses" value={`₹${totalExpenses.toLocaleString('en-IN')}`}                               icon={TrendingDown} color="bg-danger-400"  sub="This month" />
        <StatCard label="Savings Rate"     value={`${savingsRate}%`}                                                          icon={Activity}     color="bg-success-400" sub={savingsRate >= 30 ? '🎉 Great job!' : 'Aim for 30%+'} />
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6 sm:mb-8">
        <div className="glass rounded-2xl p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-surface-500">Remaining Salary</p>
              <p className="text-2xl font-bold">₹{remainingSalary.toLocaleString('en-IN')}</p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-success-500/10 flex items-center justify-center">
              <Wallet size={18} className="text-success-400" />
            </div>
          </div>
          <p className="text-sm text-surface-400">Available to spend after expenses and completed goal contributions.</p>
        </div>
        <div className="glass rounded-2xl p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-surface-500">Financial Plan Status</p>
              <p className="text-lg font-semibold">Allocated ₹{allocations.reduce((sum, item) => sum + item.amount, 0).toLocaleString('en-IN')}</p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-brand-500/10 flex items-center justify-center">
              <Calculator size={18} className="text-brand-400" />
            </div>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${Math.min(100, monthlyIncome > 0 ? (allocations.reduce((sum, item) => sum + item.amount, 0) / monthlyIncome) * 100 : 0)}%` }} />
          </div>
          <div className="mt-3 flex justify-between text-xs text-surface-500">
            <span>Income: ₹{monthlyIncome.toLocaleString('en-IN')}</span>
            <span>Spent: ₹{totalExpenses.toLocaleString('en-IN')}</span>
          </div>
        </div>
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
                        Your &ldquo;{item.impact.goalName}&rdquo; goal is now delayed by {item.impact.daysDelayed} day{item.impact.daysDelayed !== 1 ? 's' : ''}.
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
                {goals.slice(0, 4).map((goal) => {
                  const pct   = Math.min(100, Math.round((goal.savedAmount / goal.targetAmount) * 100))
                  const color = getProgressColor(pct)
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
                        <span className="text-xs font-bold flex-shrink-0" style={{ color }}>{pct}%</span>
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
                  const colors = ['#6366f1', '#f97316', '#22c55e', '#06b6d4', '#8b5cf6']
                  return (
                    <div key={alloc.id}>
                      <div className="flex justify-between text-xs text-surface-400 mb-1">
                        <span className="truncate flex-1">{alloc.goalName}</span>
                        <span className="ml-2 flex-shrink-0">₹{alloc.amount.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="h-1 bg-white/8 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: colors[i % colors.length] }}
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

          {/* Banner Ad */}
          <BannerAd />
        </div>
      </div>
    </div>
  )
}
