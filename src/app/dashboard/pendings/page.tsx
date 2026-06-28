'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { deletePendingContribution, getPendingContributions, updateGoal, updatePendingContribution, getGoals } from '@/lib/db'
import { friendlyError } from '@/lib/errors'
import { format } from 'date-fns'
import { CheckCircle2, Clock3, Pencil, Sparkles, Target } from 'lucide-react'
import type { Goal, PendingContribution } from '@/types'

export default function PendingsPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [items, setItems] = useState<PendingContribution[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const currentMonth = format(new Date(), 'yyyy-MM')

  useEffect(() => {
    if (!user) return
    Promise.all([
      getPendingContributions(user.uid, currentMonth),
      getGoals(user.uid),
    ])
      .then(([pending, goalList]) => {
        setItems(pending)
        setGoals(goalList)
      })
      .catch(err => showToast(friendlyError(err, 'Could not load pending contributions.'), 'error'))
      .finally(() => setLoading(false))
  }, [user, currentMonth])

  const totalPending = useMemo(() => items.reduce((sum, item) => sum + (item.status === 'pending' ? item.amount : 0), 0), [items])

  async function handleComplete(item: PendingContribution) {
    if (!user) return
    const goal = goals.find(g => g.id === item.goalId)
    if (!goal) return
    try {
      const updatedSaved = goal.savedAmount + item.amount
      await updateGoal(goal.id, { savedAmount: updatedSaved })
      await updatePendingContribution(item.id, { status: 'completed', updatedAt: new Date() as any })
      await deletePendingContribution(item.id)
      setItems(prev => prev.filter(entry => entry.id !== item.id))
      showToast(`Marked ${item.goalName} as completed.`, 'success')
    } catch (err) {
      showToast(friendlyError(err, 'Could not complete the pending contribution.'), 'error')
    }
  }

  function startEdit(item: PendingContribution) {
    setEditingId(item.id)
    setDraft(String(item.amount))
  }

  async function saveEdit(item: PendingContribution) {
    if (!user) return
    const amount = Number(draft)
    if (!amount || amount <= 0) {
      showToast('Amount must be greater than zero.', 'error')
      return
    }
    try {
      await updatePendingContribution(item.id, { amount, updatedAt: new Date() as any })
      setItems(prev => prev.map(entry => entry.id === item.id ? { ...entry, amount } : entry))
      setEditingId(null)
      setDraft('')
      showToast('Pending amount updated.', 'success')
    } catch (err) {
      showToast(friendlyError(err, 'Could not update pending contribution.'), 'error')
    }
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold">Pendings</h1>
        <p className="text-surface-400 text-sm mt-1">Track planned contributions that still need to move.</p>
      </div>

      <div className="glass rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-surface-400">Pending this month</p>
            <p className="text-2xl font-bold">₹{totalPending.toLocaleString('en-IN')}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center">
            <Clock3 className="text-brand-400" size={20} />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="glass rounded-2xl h-20 shimmer" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center">
          <Target size={32} className="text-surface-600 mx-auto mb-3" />
          <p className="text-surface-400 text-sm">No pending transfers yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="glass rounded-2xl p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="font-semibold text-surface-100">{item.goalName}</p>
                  <p className="text-sm text-surface-400 mt-1">Planned transfer of ₹{item.amount.toLocaleString('en-IN')}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {editingId === item.id ? (
                    <>
                      <input
                        type="number"
                        value={draft}
                        onChange={e => setDraft(e.target.value)}
                        className="w-24 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                      />
                      <button onClick={() => saveEdit(item)} className="rounded-xl bg-brand-500 px-3 py-2 text-sm">Save</button>
                    </>
                  ) : (
                    <button onClick={() => startEdit(item)} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-surface-300">
                      <Pencil size={14} /> Edit Amount
                    </button>
                  )}
                  <button onClick={() => handleComplete(item)} className="flex items-center gap-2 rounded-xl bg-success-500/15 px-3 py-2 text-sm text-success-300">
                    <CheckCircle2 size={14} /> Mark Complete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
