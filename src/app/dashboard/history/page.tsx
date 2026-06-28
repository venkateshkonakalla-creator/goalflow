'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { getMonthlySummaries } from '@/lib/db'
import { friendlyError } from '@/lib/errors'
import { History, Wallet, TrendingDown, PiggyBank } from 'lucide-react'
import type { MonthlySummary } from '@/types'

export default function HistoryPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [summaries, setSummaries] = useState<MonthlySummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    getMonthlySummaries(user.uid)
      .then(setSummaries)
      .catch(err => showToast(friendlyError(err, 'Could not load monthly history.'), 'error'))
      .finally(() => setLoading(false))
  }, [user])

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold">Monthly History</h1>
        <p className="text-surface-400 text-sm mt-1">Review past monthly summaries and rolling progress.</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="glass rounded-2xl h-24 shimmer" />)}
        </div>
      ) : summaries.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center">
          <History size={32} className="text-surface-600 mx-auto mb-3" />
          <p className="text-surface-400 text-sm">No monthly history yet.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {summaries.sort((a, b) => b.month.localeCompare(a.month)).map(summary => (
            <div key={summary.id} className="glass rounded-2xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div>
                  <p className="text-lg font-semibold">{summary.month}</p>
                  <p className="text-sm text-surface-400">Saved ₹{summary.saved.toLocaleString('en-IN')} this month</p>
                </div>
                <div className="rounded-full bg-brand-500/10 px-3 py-1 text-sm text-brand-300">{summary.savingsRate}% savings rate</div>
              </div>
              <div className="grid sm:grid-cols-4 gap-3">
                <div className="rounded-xl bg-white/4 p-3">
                  <div className="flex items-center gap-2 text-surface-400 text-xs mb-1"><Wallet size={14} /> Income</div>
                  <p className="text-base font-semibold">₹{summary.income.toLocaleString('en-IN')}</p>
                </div>
                <div className="rounded-xl bg-white/4 p-3">
                  <div className="flex items-center gap-2 text-surface-400 text-xs mb-1"><TrendingDown size={14} /> Expenses</div>
                  <p className="text-base font-semibold">₹{summary.expenses.toLocaleString('en-IN')}</p>
                </div>
                <div className="rounded-xl bg-white/4 p-3">
                  <div className="flex items-center gap-2 text-surface-400 text-xs mb-1"><PiggyBank size={14} /> Remaining</div>
                  <p className="text-base font-semibold">₹{summary.remainingSalary.toLocaleString('en-IN')}</p>
                </div>
                <div className="rounded-xl bg-white/4 p-3">
                  <div className="flex items-center gap-2 text-surface-400 text-xs mb-1"><History size={14} /> Contributions</div>
                  <p className="text-base font-semibold">₹{summary.goalContributions.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
