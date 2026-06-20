'use client'
// src/app/dashboard/afford/page.tsx
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { useAd } from '@/context/AdContext'
import { getGoals, getExpenses, getIncome, getAllocations } from '@/lib/db'
import { calculateAffordability, type AffordabilityResult } from '@/lib/goalImpact'
import { friendlyError } from '@/lib/errors'
import { trackAffordabilityCheck } from '@/lib/analytics'
import { format } from 'date-fns'
import { Calculator, ArrowRight, CheckCircle2, XCircle, TrendingDown, TrendingUp, Sparkles } from 'lucide-react'
import type { Goal, Expense, Income, Allocation } from '@/types'

export default function AffordPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const { watchAd, isUnlocked, consumeAd } = useAd()
  const [goals, setGoals] = useState<Goal[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [income, setIncome] = useState<Income | null>(null)
  const [allocations, setAllocations] = useState<Allocation[]>([])
  const [loading, setLoading] = useState(true)

  const [itemName, setItemName] = useState('')
  const [cost, setCost] = useState('')
  const [result, setResult] = useState<AffordabilityResult | null>(null)

  const currentMonth = format(new Date(), 'yyyy-MM')

  useEffect(() => {
    if (!user) return
    Promise.all([
      getGoals(user.uid),
      getExpenses(user.uid, currentMonth),
      getIncome(user.uid, currentMonth),
      getAllocations(user.uid, currentMonth),
    ]).then(([g, e, inc, alloc]) => {
      setGoals(g)
      setExpenses(e)
      setIncome(inc)
      setAllocations(alloc)
    }).catch(err => showToast(friendlyError(err, 'Could not load your financial data.'), 'error'))
      .finally(() => setLoading(false))
  }, [user, currentMonth]) // eslint-disable-line react-hooks/exhaustive-deps

  const monthlyIncome = income?.amount || 0
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const totalAllocated = allocations.reduce((s, a) => s + a.amount, 0)

  async function handleCalculate() {
    const costNum = Number(cost)
    if (!costNum || costNum <= 0) {
      showToast('Please enter a valid cost.', 'error')
      return
    }
    if (!monthlyIncome) {
      showToast('Set your monthly income in Planning first for an accurate result.', 'error')
      return
    }

    const r = calculateAffordability(
      itemName.trim() || 'this purchase',
      costNum,
      monthlyIncome,
      totalExpenses,
      totalAllocated,
      goals
    )
    setResult(r)
    trackAffordabilityCheck(costNum, r.canAfford)
    await consumeAd('affordability_checker')
  }

  async function handleButtonClick() {
    if (isUnlocked('affordability_checker')) {
      await handleCalculate()
    } else {
      const success = await watchAd('affordability_checker')
      if (success) {
        await handleCalculate()
      }
    }
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 md:p-8 max-w-2xl">
        <div className="glass rounded-2xl h-64 shimmer" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-2xl">
      {/* ── Header ── */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 bg-brand-500/15 rounded-xl flex items-center justify-center flex-shrink-0">
            <Calculator size={16} className="text-brand-400" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold">Can I Afford This?</h1>
        </div>
        <p className="text-surface-400 text-sm mt-1 ml-10">
          See exactly how a purchase affects your goal timelines before you buy.
        </p>
      </div>

      {!monthlyIncome && (
        <div className="bg-warning-500/8 border border-warning-500/15 rounded-xl px-4 py-3 mb-6">
          <p className="text-sm text-warning-300">
            Set your monthly income in <span className="font-medium">Planning</span> for accurate results.
          </p>
        </div>
      )}

      {/* ── Input form ── */}
      <div className="glass rounded-2xl p-5 sm:p-6 mb-6">
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-surface-400 mb-1.5">Item</label>
            <input
              type="text"
              value={itemName}
              onChange={e => setItemName(e.target.value)}
              placeholder="e.g., iPhone"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-surface-50 placeholder:text-surface-600 focus:border-brand-500/50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-400 mb-1.5">Cost (₹)</label>
            <input
              type="number"
              inputMode="numeric"
              value={cost}
              onChange={e => setCost(e.target.value)}
              placeholder="25000"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-lg font-bold text-surface-50 placeholder:text-surface-600 focus:border-brand-500/50"
            />
          </div>
        </div>
        <button
          onClick={handleButtonClick}
          className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold py-3 rounded-xl transition-colors min-h-[48px]"
        >
          {isUnlocked('affordability_checker') ? (
            <><Sparkles size={16} /> Check affordability</>
          ) : (
            <><Sparkles size={16} /> Watch Ad to Check Affordability</>
          )}
        </button>
      </div>

      {/* ── Result ── */}
      {result && (
        <div className="space-y-4 animate-slide-up">
          {/* Verdict banner */}
          <div className={`glass rounded-2xl p-5 flex items-start gap-3 ${
            result.canAfford ? 'border-success-500/20 bg-success-500/5' : 'border-danger-500/20 bg-danger-500/5'
          }`}>
            {result.canAfford ? (
              <CheckCircle2 size={22} className="text-success-400 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle size={22} className="text-danger-400 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className={`text-sm font-semibold ${result.canAfford ? 'text-success-400' : 'text-danger-400'}`}>
                {result.canAfford
                  ? `You can afford ${result.itemName}.`
                  : `${result.itemName.charAt(0).toUpperCase()}${result.itemName.slice(1)} would put you over budget.`}
              </p>
              <p className="text-sm text-surface-400 mt-1">{result.recommendation}</p>
            </div>
          </div>

          {/* Goal forecast comparison */}
          {result.goalForecasts.length > 0 && (
            <div className="glass rounded-2xl p-5">
              <h2 className="text-sm font-semibold mb-4">Goal Completion Forecast</h2>
              <div className="space-y-4">
                {result.goalForecasts.map(g => (
                  <div key={g.goalId} className="border border-white/6 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3 gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: g.color }} />
                        <p className="text-sm font-medium text-surface-200 truncate">{g.goalName}</p>
                      </div>
                      {g.delayDays > 0 && (
                        <span className="text-xs font-semibold text-warning-400 bg-warning-500/10 px-2 py-0.5 rounded-full flex-shrink-0">
                          +{g.delayDays} day{g.delayDays !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[10px] text-surface-500 uppercase tracking-wide mb-1">Current Completion</p>
                        <p className="text-sm font-semibold text-surface-300">{g.completionBefore}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-surface-500 uppercase tracking-wide mb-1">After Purchase</p>
                        <p className={`text-sm font-semibold ${g.delayDays > 0 ? 'text-warning-400' : 'text-surface-300'}`}>
                          {g.completionAfter}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Savings rate + money remaining */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                {result.savingsRateAfter < result.savingsRateBefore ? (
                  <TrendingDown size={14} className="text-danger-400" />
                ) : (
                  <TrendingUp size={14} className="text-success-400" />
                )}
                <p className="text-xs text-surface-500">Savings Rate</p>
              </div>
              <div className="flex items-center gap-2 text-lg font-bold">
                <span className="text-surface-400">{result.savingsRateBefore}%</span>
                <ArrowRight size={14} className="text-surface-600" />
                <span className={result.savingsRateAfter < result.savingsRateBefore ? 'text-danger-400' : 'text-success-400'}>
                  {result.savingsRateAfter}%
                </span>
              </div>
            </div>

            <div className="glass rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Calculator size={14} className="text-brand-400" />
                <p className="text-xs text-surface-500">Money Remaining</p>
              </div>
              <div className="flex items-center gap-2 text-lg font-bold">
                <span className="text-surface-400">₹{result.moneyRemainingBefore.toLocaleString('en-IN')}</span>
                <ArrowRight size={14} className="text-surface-600" />
                <span className={result.moneyRemainingAfter < 0 ? 'text-danger-400' : 'text-success-400'}>
                  ₹{result.moneyRemainingAfter.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
