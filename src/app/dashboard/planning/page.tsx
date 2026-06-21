'use client'
// src/app/dashboard/planning/page.tsx
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { useAd } from '@/context/AdContext'
import { getGoals, getIncome, getAllocations, setIncome, saveAllocations } from '@/lib/db'
import { friendlyError } from '@/lib/errors'
import { format } from 'date-fns'
import { Wallet, Save, AlertCircle, CheckCircle2, Sparkles, Lock } from 'lucide-react'
import type { Goal } from '@/types'

const GOAL_COLORS = ['#6366f1', '#f97316', '#22c55e', '#06b6d4', '#8b5cf6', '#ec4899']

export default function PlanningPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const { watchAd, isUnlocked, consumeAd, usageLoading } = useAd()
  const [goals, setGoals] = useState<Goal[]>([])
  const [income, setIncomeState] = useState('')
  const [source, setSource] = useState('Salary')
  const [allocMap, setAllocMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const currentMonth = format(new Date(), 'yyyy-MM')
  const displayMonth = format(new Date(), 'MMMM yyyy')

  useEffect(() => {
    if (!user) return
    Promise.all([
      getGoals(user.uid),
      getIncome(user.uid, currentMonth),
      getAllocations(user.uid, currentMonth),
    ]).then(([g, inc, allocs]) => {
      setGoals(g)
      if (inc) {
        setIncomeState(String(inc.amount))
        setSource(inc.source || 'Salary')
      }
      const map: Record<string, string> = {}
      allocs.forEach(a => { map[a.goalId] = String(a.amount) })
      setAllocMap(map)
    }).catch(err => showToast(friendlyError(err, 'Could not load your plan.'), 'error'))
      .finally(() => setLoading(false))
  }, [user, currentMonth]) // eslint-disable-line react-hooks/exhaustive-deps

  const incomeNum = Number(income) || 0
  const totalAllocated = Object.values(allocMap).reduce((s, v) => s + (Number(v) || 0), 0)
  const remaining = incomeNum - totalAllocated
  const isOverBudget = remaining < 0
  const allocationPct = incomeNum > 0 ? Math.min(100, (totalAllocated / incomeNum) * 100) : 0

  async function handleSave() {
    if (!user) return
    if (!incomeNum || incomeNum <= 0) {
      showToast('Please enter your monthly income.', 'error')
      return
    }
    if (isOverBudget) {
      showToast("You've allocated more than your income. Reduce some allocations first.", 'error')
      return
    }

    setSaving(true)
    try {
      await setIncome(user.uid, currentMonth, incomeNum, source.trim() || 'Salary')
      const allocs = goals.map(g => ({
        goalId: g.id,
        goalName: g.name,
        amount: Number(allocMap[g.id]) || 0,
      })).filter(a => a.amount > 0)
      await saveAllocations(user.uid, currentMonth, allocs)
      setSaved(true)
      showToast('Monthly plan saved.')
      setTimeout(() => setSaved(false), 3000)
      console.log('📊 [PlanningPage] Plan saved successfully, consuming ad gate')
      await consumeAd('savings_plan')
    } catch (err) {
      showToast(friendlyError(err, 'Could not save your plan. Please try again.'), 'error')
    } finally {
      setSaving(false)
    }
  }

  function distributeEvenly() {
    if (!incomeNum || !goals.length) return
    const perGoal = Math.floor(incomeNum / goals.length)
    const map: Record<string, string> = {}
    goals.forEach(g => { map[g.id] = String(perGoal) })
    setAllocMap(map)
  }

  function fillByMonthly() {
    const map: Record<string, string> = {}
    goals.forEach(g => {
      if (g.monthlyContribution > 0) map[g.id] = String(g.monthlyContribution)
    })
    setAllocMap(map)
  }

  if (loading) return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="glass rounded-2xl h-64 shimmer" />
    </div>
  )

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-3xl">
      {/* ── Header ── */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold">Monthly Planning</h1>
        <p className="text-surface-400 text-sm mt-1">{displayMonth}</p>
      </div>

      {usageLoading ? (
        <div className="glass rounded-2xl p-8 text-center">
          <p className="text-surface-400 text-sm">Loading your plan status…</p>
        </div>
      ) : isUnlocked('savings_plan') ? (
        <>
          {/* ── Income Card ── */}
          <div className="glass rounded-2xl p-5 sm:p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Wallet size={18} className="text-brand-400" />
              <h2 className="text-base font-semibold">Monthly Income</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1.5">Amount (₹)</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={income}
                  onChange={e => setIncomeState(e.target.value)}
                  placeholder="16000"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xl font-bold text-surface-50 placeholder:text-surface-600 focus:border-brand-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1.5">Source</label>
                <input
                  type="text"
                  value={source}
                  onChange={e => setSource(e.target.value)}
                  placeholder="e.g., Salary, Freelance"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-surface-50 placeholder:text-surface-600 focus:border-brand-500/50"
                />
              </div>
            </div>
          </div>

          {/* ── Allocation ── */}
          <div className="glass rounded-2xl p-5 sm:p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
              <h2 className="text-base font-semibold">Allocate your salary</h2>
              <div className="flex gap-2">
                <button
                  onClick={fillByMonthly}
                  className="text-xs bg-white/5 hover:bg-white/8 border border-white/10 px-3 py-2 rounded-lg text-surface-400 transition-colors flex-1 sm:flex-none"
                >
                  Use goal amounts
                </button>
                <button
                  onClick={distributeEvenly}
                  className="text-xs bg-white/5 hover:bg-white/8 border border-white/10 px-3 py-2 rounded-lg text-surface-400 transition-colors flex-1 sm:flex-none"
                >
                  Split evenly
                </button>
              </div>
            </div>

            {goals.length === 0 ? (
              <p className="text-surface-500 text-sm text-center py-6">
                Create goals first, then allocate your salary to them.
              </p>
            ) : (
              <div className="space-y-4">
                {goals.map((goal, i) => {
                  const color = GOAL_COLORS[i % GOAL_COLORS.length]
                  const amount = Number(allocMap[goal.id]) || 0
                  const pct = incomeNum > 0 ? Math.min(100, (amount / incomeNum) * 100) : 0
                  return (
                    <div key={goal.id}>
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <label className="text-sm font-medium text-surface-300 truncate">{goal.name}</label>
                        {goal.monthlyContribution > 0 && (
                          <span className="text-xs text-surface-600 flex-shrink-0">
                            Suggested: ₹{goal.monthlyContribution.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-surface-500">₹</span>
                        <input
                          type="number"
                          inputMode="numeric"
                          value={allocMap[goal.id] || ''}
                          onChange={e => setAllocMap(m => ({ ...m, [goal.id]: e.target.value }))}
                          placeholder="0"
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-surface-50 placeholder:text-surface-600 focus:border-brand-500/50"
                        />
                        <span className="text-xs text-surface-500 w-8 text-right">{pct.toFixed(0)}%</span>
                      </div>
                      <div className="h-1 bg-white/6 rounded-full overflow-hidden mt-1.5">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{ width: `${pct}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── Summary ── */}
          {incomeNum > 0 && (
            <div className={`glass rounded-2xl p-5 mb-6 ${isOverBudget ? 'border-danger-500/20' : ''}`}>
              <h2 className="text-sm font-semibold mb-4">Allocation Summary</h2>

              {/* Visual bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-surface-400 mb-1.5">
                  <span>Allocated</span>
                  <span>{allocationPct.toFixed(0)}% of income</span>
                </div>
                <div className="h-3 bg-white/8 rounded-full overflow-hidden flex">
                  {goals.map((goal, i) => {
                    const amount = Number(allocMap[goal.id]) || 0
                    const pct = incomeNum > 0 ? (amount / incomeNum) * 100 : 0
                    if (!pct) return null
                    return (
                      <div
                        key={goal.id}
                        className="h-full transition-all duration-300"
                        style={{ width: `${pct}%`, backgroundColor: GOAL_COLORS[i % GOAL_COLORS.length] }}
                        title={`${goal.name}: ₹${amount.toLocaleString('en-IN')}`}
                      />
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                <div>
                  <p className="text-xs text-surface-500 mb-1">Income</p>
                  <p className="text-sm sm:text-base font-bold">₹{incomeNum.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-xs text-surface-500 mb-1">Allocated</p>
                  <p className="text-sm sm:text-base font-bold text-brand-300">₹{totalAllocated.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-xs text-surface-500 mb-1">Remaining</p>
                  <p className={`text-sm sm:text-base font-bold ${isOverBudget ? 'text-danger-400' : 'text-success-400'}`}>
                    ₹{Math.abs(remaining).toLocaleString('en-IN')}
                    {isOverBudget ? ' over' : ' free'}
                  </p>
                </div>
              </div>

              {isOverBudget && (
                <div className="mt-4 flex items-start gap-2 text-danger-400 text-xs">
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                  You've allocated more than your income. Reduce some allocations.
                </div>
              )}
            </div>
          )}

          {/* ── Save ── */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-colors min-h-[48px]"
          >
            {saved ? (
              <><CheckCircle2 size={18} /> Plan saved!</>
            ) : saving ? (
              'Saving…'
            ) : (
              <><Save size={18} /> Save monthly plan</>
            )}
          </button>
        </>
      ) : (
        <div className="glass rounded-3xl p-8 sm:p-12 text-center flex flex-col items-center justify-center border border-white/5 relative overflow-hidden mt-6">
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-brand-500/10 rounded-full blur-3xl" />
          <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 mb-4 z-10">
            <Lock size={22} className="animate-pulse" />
          </div>
          <h2 className="text-lg font-bold mb-2 text-surface-50 z-10">Monthly Savings Planner</h2>
          <p className="text-sm text-surface-400 max-w-sm mb-6 z-10 leading-relaxed">
            Generate your monthly salary savings allocations and view planning charts instantly.
          </p>
          <button
            onClick={async () => {
              console.log('📊 [PlanningPage] Watch ad button clicked')
              await watchAd('savings_plan')
            }}
            disabled={usageLoading}
            className="flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl transition-all hover:-translate-y-0.5 z-10 shadow-glow min-h-[46px]"
          >
            <Sparkles size={16} /> Watch Ad to Generate Plan
          </button>
        </div>
      )}
    </div>
  )
}
