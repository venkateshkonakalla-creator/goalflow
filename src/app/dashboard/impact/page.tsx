'use client'
// src/app/dashboard/impact/page.tsx
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { getGoals, getExpenses } from '@/lib/db'
import { getImpactSummary } from '@/lib/goalImpact'
import { friendlyError } from '@/lib/errors'
import { format } from 'date-fns'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import { Zap, Clock, Target, TrendingDown, CheckCircle2 } from 'lucide-react'
import type { Goal, Expense, ExpenseCategory } from '@/types'

const CATEGORY_META: Record<ExpenseCategory, { label: string; emoji: string }> = {
  food: { label: 'Food', emoji: '🍽️' },
  travel: { label: 'Travel', emoji: '🚌' },
  shopping: { label: 'Shopping', emoji: '🛍️' },
  entertainment: { label: 'Fun', emoji: '🎮' },
  education: { label: 'Education', emoji: '📚' },
  health: { label: 'Health', emoji: '💊' },
  other: { label: 'Other', emoji: '💸' },
}

const GOAL_COLORS = ['#6366f1', '#f97316', '#22c55e', '#06b6d4', '#8b5cf6', '#ec4899']

export default function ImpactPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [goals, setGoals] = useState<Goal[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  const currentMonth = format(new Date(), 'yyyy-MM')

  useEffect(() => {
    if (!user) return
    Promise.all([getGoals(user.uid), getExpenses(user.uid, currentMonth)])
      .then(([g, e]) => { setGoals(g); setExpenses(e) })
      .catch(err => showToast(friendlyError(err, 'Could not load impact data.'), 'error'))
      .finally(() => setLoading(false))
  }, [user, currentMonth]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="p-4 sm:p-6 md:p-8 max-w-5xl">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[...Array(3)].map((_, i) => <div key={i} className="glass rounded-2xl h-28 shimmer" />)}
        </div>
        <div className="glass rounded-2xl h-64 shimmer" />
      </div>
    )
  }

  const summary = getImpactSummary(expenses, goals)
  const barData = summary.goalDelayBreakdown.map(g => ({ name: g.goalName, days: g.days, fill: g.color }))

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold">Impact</h1>
        <p className="text-surface-400 text-sm mt-1">How this month's spending affects your goals</p>
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={14} className="text-warning-400" />
            <p className="text-xs text-surface-500">Total Days Lost</p>
          </div>
          <p className="text-2xl font-bold">{summary.totalDaysLost}</p>
          <p className="text-xs text-surface-600 mt-1">across all goals this month</p>
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Target size={14} className="text-danger-400" />
            <p className="text-xs text-surface-500">Most Affected Goal</p>
          </div>
          {summary.mostAffectedGoal ? (
            <>
              <p className="text-lg font-bold truncate">{summary.mostAffectedGoal.name}</p>
              <p className="text-xs text-surface-600 mt-1">delayed by {summary.mostAffectedGoal.days} day{summary.mostAffectedGoal.days !== 1 ? 's' : ''}</p>
            </>
          ) : (
            <p className="text-sm text-surface-500 mt-2">No goals affected</p>
          )}
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={14} className="text-brand-400" />
            <p className="text-xs text-surface-500">Biggest Delay</p>
          </div>
          {summary.biggestDelayExpense ? (
            <>
              <p className="text-lg font-bold">₹{summary.biggestDelayExpense.amount.toLocaleString('en-IN')}</p>
              <p className="text-xs text-surface-600 mt-1 capitalize">
                {summary.biggestDelayExpense.category} · {summary.biggestDelayExpense.goalImpact?.daysDelayed} day delay
              </p>
            </>
          ) : (
            <p className="text-sm text-surface-500 mt-2">No purchases caused delays</p>
          )}
        </div>
      </div>

      {summary.totalDaysLost === 0 ? (
        <div className="glass rounded-2xl p-8 sm:p-12 text-center">
          <CheckCircle2 size={36} className="text-success-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">No goal delays this month 🎉</h2>
          <p className="text-surface-400 text-sm max-w-sm mx-auto">
            Every expense you've logged so far has had minimal impact on your goal timelines. Keep it up!
          </p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* ── Goal Delay Breakdown chart ── */}
          <div className="glass rounded-2xl p-5">
            <h2 className="text-sm font-semibold mb-5">Goal delay breakdown</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} unit="d" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} width={100} />
                <Tooltip
                  formatter={(v: number) => [`${v} day${v !== 1 ? 's' : ''}`, 'Delay']}
                  contentStyle={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
                />
                <Bar dataKey="days" radius={[0, 6, 6, 0]}>
                  {barData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill || GOAL_COLORS[i % GOAL_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* ── Spending decisions causing damage ── */}
          <div className="glass rounded-2xl p-5">
            <h2 className="text-sm font-semibold mb-5">Spending decisions causing the most damage</h2>
            <div className="space-y-3">
              {summary.categoryDelayBreakdown.map(cat => {
                const meta = CATEGORY_META[cat.category]
                const pct = Math.min(100, Math.round((cat.days / summary.totalDaysLost) * 100))
                return (
                  <div key={cat.category}>
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <span className="text-sm text-surface-300 flex items-center gap-1.5">
                        <span>{meta.emoji}</span> {meta.label}
                      </span>
                      <span className="text-xs text-surface-500 flex-shrink-0">
                        ₹{cat.amount.toLocaleString('en-IN')} → <span className="text-warning-400 font-medium">{cat.days}d</span>
                      </span>
                    </div>
                    <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                      <div className="h-full bg-warning-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Per-transaction list ── */}
          <div className="glass rounded-2xl p-5 lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={14} className="text-warning-400" />
              <h2 className="text-sm font-semibold">Transactions with goal impact</h2>
            </div>
            <div className="divide-y divide-white/4">
              {expenses
                .filter(e => (e.goalImpact?.daysDelayed || 0) > 0)
                .sort((a, b) => (b.goalImpact?.daysDelayed || 0) - (a.goalImpact?.daysDelayed || 0))
                .map(e => {
                  const meta = CATEGORY_META[e.category]
                  return (
                    <div key={e.id} className="flex items-center gap-3 py-3">
                      <span className="text-lg flex-shrink-0">{meta.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-surface-200 truncate">{e.description || meta.label}</p>
                        <p className="text-xs text-surface-500">
                          {format(new Date(e.date), 'dd MMM')} · delays <span className="text-warning-400">{e.goalImpact?.goalName}</span>
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold text-surface-100">₹{e.amount.toLocaleString('en-IN')}</p>
                        <p className="text-xs text-warning-400">+{e.goalImpact?.daysDelayed}d</p>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
