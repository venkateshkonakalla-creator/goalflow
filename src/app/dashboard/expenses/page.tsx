'use client'
// src/app/dashboard/expenses/page.tsx
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { getGoals, getExpenses, createExpense, updateExpense, deleteExpense, getAllocations } from '@/lib/db'
import { calculateGoalImpact, getImpactMessage } from '@/lib/goalImpact'
import { friendlyError } from '@/lib/errors'
import { trackExpenseAdded } from '@/lib/analytics'
import { format } from 'date-fns'
import { Plus, Trash2, Pencil, Zap, Receipt, TrendingDown } from 'lucide-react'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import type { Goal, Expense, ExpenseCategory, Allocation } from '@/types'

const CATEGORIES: { value: ExpenseCategory; label: string; emoji: string; color: string }[] = [
  { value: 'food', label: 'Food', emoji: '🍽️', color: 'bg-orange-500/15 text-orange-300' },
  { value: 'travel', label: 'Travel', emoji: '🚌', color: 'bg-blue-500/15 text-blue-300' },
  { value: 'shopping', label: 'Shopping', emoji: '🛍️', color: 'bg-pink-500/15 text-pink-300' },
  { value: 'entertainment', label: 'Fun', emoji: '🎮', color: 'bg-purple-500/15 text-purple-300' },
  { value: 'education', label: 'Education', emoji: '📚', color: 'bg-cyan-500/15 text-cyan-300' },
  { value: 'health', label: 'Health', emoji: '💊', color: 'bg-green-500/15 text-green-300' },
  { value: 'other', label: 'Other', emoji: '💸', color: 'bg-surface-500/15 text-surface-300' },
]

const DEFAULT_FORM = {
  amount: '',
  category: 'food' as ExpenseCategory,
  description: '',
  date: new Date().toISOString().split('T')[0],
}

function validateForm(form: typeof DEFAULT_FORM): string | null {
  if (!form.amount || Number(form.amount) <= 0) return 'Amount must be greater than 0.'
  if (!form.date) return 'Please select a date.'
  return null
}

export default function ExpensesPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [goals, setGoals] = useState<Goal[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [allocations, setAllocations] = useState<Allocation[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(DEFAULT_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [latestImpact, setLatestImpact] = useState<{ message: string; daysDelayed: number } | null>(null)

  const currentMonth = format(new Date(), 'yyyy-MM')

  useEffect(() => {
    if (!user) return
    Promise.all([
      getGoals(user.uid),
      getExpenses(user.uid, currentMonth),
      getAllocations(user.uid, currentMonth),
    ]).then(([g, e, a]) => {
      setGoals(g)
      setExpenses(e)
      setAllocations(a)
    }).catch(err => showToast(friendlyError(err, 'Could not load expenses.'), 'error'))
      .finally(() => setLoading(false))
  }, [user, currentMonth]) // eslint-disable-line react-hooks/exhaustive-deps

  function openCreate() {
    setForm(DEFAULT_FORM)
    setFormError(null)
    setEditingId(null)
    setShowForm(true)
  }

  function openEdit(expense: Expense) {
    setForm({
      amount: String(expense.amount),
      category: expense.category,
      description: expense.description,
      date: expense.date,
    })
    setFormError(null)
    setEditingId(expense.id)
    setShowForm(true)
  }

  async function handleSave() {
    if (!user) return
    const err = validateForm(form)
    if (err) { setFormError(err); return }

    setSaving(true)
    setFormError(null)
    setLatestImpact(null)

    const amount = Number(form.amount)
    const expenseData: Omit<Expense, 'id' | 'userId' | 'createdAt'> = {
      amount,
      category: form.category,
      description: form.description.trim(),
      date: form.date,
    }

    // Calculate goal impact before saving
    const impact = calculateGoalImpact(
      { ...expenseData, id: '', userId: user.uid, createdAt: new Date() },
      goals,
      allocations
    )
    if (impact) {
      expenseData.goalImpact = impact
      if (impact.daysDelayed > 0) {
        setLatestImpact({ message: getImpactMessage(impact, form.category), daysDelayed: impact.daysDelayed })
      }
    }

    try {
      if (editingId) {
        await updateExpense(editingId, expenseData)
        setExpenses(prev => prev.map(e => e.id === editingId ? { ...e, ...expenseData } : e))
        showToast('Expense updated.')
      } else {
        const id = await createExpense(user.uid, expenseData)
        const newExpense: Expense = { id, userId: user.uid, ...expenseData, createdAt: new Date() }
        setExpenses(prev => [newExpense, ...prev])
        trackExpenseAdded(form.category, amount, impact?.daysDelayed || 0)
        showToast('Expense logged.')
      }
      setForm(DEFAULT_FORM)
      setShowForm(false)
    } catch (err) {
      setFormError(friendlyError(err, 'Could not save this expense. Please try again.'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteExpense(deleteTarget.id)
      setExpenses(prev => prev.filter(e => e.id !== deleteTarget.id))
      showToast('Expense deleted.')
      setDeleteTarget(null)
    } catch (err) {
      showToast(friendlyError(err, 'Could not delete this expense.'), 'error')
    } finally {
      setDeleting(false)
    }
  }

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)

  // Group by category
  const byCategory = CATEGORIES.map(cat => ({
    ...cat,
    total: expenses.filter(e => e.category === cat.value).reduce((s, e) => s + e.amount, 0),
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total)

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Expenses</h1>
          <p className="text-surface-400 text-sm mt-1">
            ₹{totalExpenses.toLocaleString('en-IN')} spent this month
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm px-4 py-2.5 rounded-xl transition-colors font-medium min-h-[44px] sm:w-auto w-full"
        >
          <Plus size={16} /> Log Expense
        </button>
      </div>

      {/* ── Goal Impact Banner ── */}
      {latestImpact && (
        <div className="glass rounded-2xl p-5 mb-6 border-warning-500/20 bg-warning-500/5 animate-slide-up">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-warning-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Zap size={18} className="text-warning-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-warning-300">Goal Impact</p>
              <p className="text-sm text-surface-300 mt-0.5">{latestImpact.message}</p>
            </div>
            <button
              onClick={() => setLatestImpact(null)}
              className="ml-auto text-surface-600 hover:text-surface-400 text-lg leading-none flex-shrink-0"
              aria-label="Dismiss"
            >×</button>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ── Expense List ── */}
        <div className="lg:col-span-2">
          <div className="glass rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5">
              <h2 className="text-sm font-semibold">This month's expenses</h2>
            </div>

            {loading ? (
              <div className="p-5 space-y-3">
                {[...Array(5)].map((_, i) => <div key={i} className="h-14 rounded-xl shimmer" />)}
              </div>
            ) : expenses.length === 0 ? (
              <div className="p-8 sm:p-12 text-center">
                <Receipt size={32} className="text-surface-600 mx-auto mb-3" />
                <p className="text-surface-400 text-sm mb-4">No expenses yet this month.</p>
                <button
                  onClick={openCreate}
                  className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm px-4 py-2.5 rounded-xl transition-colors font-medium min-h-[44px]"
                >
                  <Plus size={14} /> Log your first expense
                </button>
              </div>
            ) : (
              <div className="divide-y divide-white/4">
                {expenses.map(expense => {
                  const cat = CATEGORIES.find(c => c.value === expense.category)
                  return (
                    <div key={expense.id} className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4 hover:bg-white/2 transition-colors group">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base ${cat?.color || ''} bg-opacity-20 flex-shrink-0`}>
                        {cat?.emoji || '💸'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-surface-200 truncate">
                          {expense.description || cat?.label || 'Expense'}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className={`text-xs px-1.5 py-0.5 rounded-md ${cat?.color}`}>
                            {cat?.label}
                          </span>
                          <span className="text-xs text-surface-600">
                            {format(new Date(expense.date), 'dd MMM')}
                          </span>
                          {expense.goalImpact && expense.goalImpact.daysDelayed > 0 && (
                            <span className="text-xs text-warning-500 flex items-center gap-0.5">
                              <Zap size={10} />
                              {expense.goalImpact.daysDelayed}d delay
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        <span className="text-sm font-semibold text-surface-100 mr-1">
                          ₹{expense.amount.toLocaleString('en-IN')}
                        </span>
                        <button
                          onClick={() => openEdit(expense)}
                          className="p-2 text-surface-600 hover:text-surface-300 rounded-lg hover:bg-white/5 transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                          aria-label="Edit expense"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(expense)}
                          className="p-2 text-surface-600 hover:text-danger-400 rounded-lg hover:bg-danger-500/8 transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                          aria-label="Delete expense"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Category breakdown ── */}
        <div className="space-y-4">
          <div className="glass rounded-2xl p-5">
            <h2 className="text-sm font-semibold mb-4">Spending by category</h2>
            {byCategory.length === 0 ? (
              <p className="text-surface-500 text-xs">No data yet.</p>
            ) : (
              <div className="space-y-3">
                {byCategory.map(cat => (
                  <div key={cat.value}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{cat.emoji}</span>
                        <span className="text-xs text-surface-400">{cat.label}</span>
                      </div>
                      <span className="text-xs font-medium text-surface-300">
                        ₹{cat.total.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="h-1 bg-white/8 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-400 rounded-full"
                        style={{ width: `${Math.min(100, (cat.total / Math.max(1, totalExpenses)) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown size={16} className="text-danger-400" />
              <p className="text-xs text-surface-400">Total spent</p>
            </div>
            <p className="text-2xl font-bold">₹{totalExpenses.toLocaleString('en-IN')}</p>
            <p className="text-xs text-surface-500 mt-1">This month</p>
          </div>
        </div>
      </div>

      {/* ── Add/Edit Expense Modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative z-10 w-full sm:max-w-sm glass rounded-t-2xl sm:rounded-2xl p-6 max-h-[92vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-6">{editingId ? 'Edit Expense' : 'Log Expense'}</h2>

            {formError && (
              <div className="bg-danger-500/10 border border-danger-500/20 text-danger-400 text-sm rounded-xl px-4 py-3 mb-4">
                {formError}
              </div>
            )}

            <div className="space-y-4">
              {/* Amount */}
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1.5">Amount (₹)</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="500"
                  autoFocus
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-lg font-bold text-surface-50 placeholder:text-surface-600 focus:border-brand-500/50"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-2">Category</label>
                <div className="grid grid-cols-4 gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, category: cat.value }))}
                      className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center transition-colors min-h-[56px] ${
                        form.category === cat.value
                          ? 'border-brand-500/50 bg-brand-500/10'
                          : 'border-white/8 bg-white/3 hover:bg-white/6'
                      }`}
                    >
                      <span className="text-lg">{cat.emoji}</span>
                      <span className="text-xs text-surface-400">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1.5">Description (optional)</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="What did you buy?"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-surface-50 placeholder:text-surface-600 focus:border-brand-500/50"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1.5">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-surface-50 focus:border-brand-500/50"
                />
              </div>

              {/* Impact preview */}
              {form.amount && goals.length > 0 && (
                <div className="bg-warning-500/8 border border-warning-500/15 rounded-xl p-3">
                  <p className="text-xs text-warning-400">
                    <Zap size={12} className="inline mr-1" />
                    This will be analyzed for goal impact when saved.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 bg-white/5 hover:bg-white/8 border border-white/10 text-surface-300 py-3 rounded-xl text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
              >
                {saving ? 'Saving…' : editingId ? 'Save changes' : 'Log expense'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirmation ── */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete expense?"
        description={deleteTarget ? `"${deleteTarget.description || deleteTarget.category}" (₹${deleteTarget.amount.toLocaleString('en-IN')}) will be permanently removed.` : undefined}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
