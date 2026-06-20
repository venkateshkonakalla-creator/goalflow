'use client'
// src/app/dashboard/analytics/page.tsx
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { getGoals, getExpenses } from '@/lib/db'
import { friendlyError } from '@/lib/errors'
import { format, subMonths } from 'date-fns'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react'
import type { Goal, Expense } from '@/types'

const COLORS = ['#6366f1', '#f97316', '#22c55e', '#06b6d4', '#8b5cf6', '#ec4899', '#71717a']

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-900 border border-white/10 rounded-xl px-3 py-2 text-xs">
      <p className="text-surface-400 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: ₹{Number(p.value).toLocaleString('en-IN')}
        </p>
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [goals, setGoals] = useState<Goal[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([
      getGoals(user.uid),
      getExpenses(user.uid),
    ]).then(([g, e]) => {
      setGoals(g)
      setExpenses(e)
    }).catch(err => showToast(friendlyError(err, 'Could not load insights.'), 'error'))
      .finally(() => setLoading(false))
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  // Monthly spending data (last 6 months)
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const month = format(subMonths(new Date(), 5 - i), 'yyyy-MM')
    const label = format(subMonths(new Date(), 5 - i), 'MMM')
    const monthExpenses = expenses.filter(e => e.date.startsWith(month))
    const total = monthExpenses.reduce((s, e) => s + e.amount, 0)
    return { month: label, expenses: total }
  })

  // Category breakdown for current month
  const currentMonth = format(new Date(), 'yyyy-MM')
  const currentMonthExpenses = expenses.filter(e => e.date.startsWith(currentMonth))
  const categoryData = [
    { name: 'Food', value: currentMonthExpenses.filter(e => e.category === 'food').reduce((s, e) => s + e.amount, 0) },
    { name: 'Travel', value: currentMonthExpenses.filter(e => e.category === 'travel').reduce((s, e) => s + e.amount, 0) },
    { name: 'Shopping', value: currentMonthExpenses.filter(e => e.category === 'shopping').reduce((s, e) => s + e.amount, 0) },
    { name: 'Fun', value: currentMonthExpenses.filter(e => e.category === 'entertainment').reduce((s, e) => s + e.amount, 0) },
    { name: 'Education', value: currentMonthExpenses.filter(e => e.category === 'education').reduce((s, e) => s + e.amount, 0) },
    { name: 'Health', value: currentMonthExpenses.filter(e => e.category === 'health').reduce((s, e) => s + e.amount, 0) },
    { name: 'Other', value: currentMonthExpenses.filter(e => e.category === 'other').reduce((s, e) => s + e.amount, 0) },
  ].filter(d => d.value > 0)

  // Goal progress data
  const goalProgressData = goals.map(g => ({
    name: g.name.length > 12 ? g.name.slice(0, 12) + '…' : g.name,
    saved: g.savedAmount,
    remaining: Math.max(0, g.targetAmount - g.savedAmount),
    target: g.targetAmount,
  }))

  const totalExpensesThisMonth = currentMonthExpenses.reduce((s, e) => s + e.amount, 0)
  const avgMonthly = monthlyData.length > 0
    ? Math.round(monthlyData.reduce((s, m) => s + m.expenses, 0) / monthlyData.length)
    : 0

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold">Insights</h1>
        <p className="text-surface-400 text-sm mt-1">Your financial trends and insights</p>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => <div key={i} className="glass rounded-2xl h-64 shimmer" />)}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Quick stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'This month', value: `₹${totalExpensesThisMonth.toLocaleString('en-IN')}`, sub: 'spent', icon: TrendingDown, color: 'text-danger-400' },
              { label: 'Monthly avg', value: `₹${avgMonthly.toLocaleString('en-IN')}`, sub: '6-month avg', icon: BarChart3, color: 'text-brand-400' },
              { label: 'Goals active', value: goals.filter(g => g.savedAmount < g.targetAmount).length, sub: 'in progress', icon: TrendingUp, color: 'text-success-400' },
              { label: 'Goals done', value: goals.filter(g => g.savedAmount >= g.targetAmount).length, sub: 'completed', icon: TrendingUp, color: 'text-warning-400' },
            ].map(stat => (
              <div key={stat.label} className="glass rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon size={14} className={stat.color} />
                  <p className="text-xs text-surface-500">{stat.label}</p>
                </div>
                <p className="text-xl font-bold">{stat.value}</p>
                <p className="text-xs text-surface-600 mt-0.5">{stat.sub}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Monthly spending trend */}
            <div className="glass rounded-2xl p-5">
              <h2 className="text-sm font-semibold mb-5">Monthly spending (6 months)</h2>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#6366f1" fill="url(#expGrad)" strokeWidth={2} dot={{ fill: '#6366f1', r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Category breakdown pie */}
            <div className="glass rounded-2xl p-5">
              <h2 className="text-sm font-semibold mb-5">Spending by category (this month)</h2>
              {categoryData.length === 0 ? (
                <div className="flex items-center justify-center h-[220px]">
                  <p className="text-surface-500 text-sm">No expenses this month.</p>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width="60%" height={220}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {categoryData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any) => `₹${Number(v).toLocaleString('en-IN')}`} contentStyle={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2">
                    {categoryData.map((d, i) => (
                      <div key={d.name} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-xs text-surface-400 flex-1 truncate">{d.name}</span>
                        <span className="text-xs font-medium text-surface-300">
                          {Math.round((d.value / totalExpensesThisMonth) * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Goal progress chart */}
          {goalProgressData.length > 0 && (
            <div className="glass rounded-2xl p-5">
              <h2 className="text-sm font-semibold mb-5">Goal progress</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={goalProgressData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#71717a' }} />
                  <Bar dataKey="saved" name="Saved" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="remaining" name="Remaining" stackId="a" fill="rgba(255,255,255,0.08)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
