'use client'
// src/app/dashboard/goals/page.tsx
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { useAd } from '@/context/AdContext'
import { getGoals, getExpenses, createGoal, updateGoal, deleteGoal } from '@/lib/db'
import { forecastDateLabel, getGoalHealthStatus, type GoalHealthStatus } from '@/lib/goalImpact'
import { friendlyError } from '@/lib/errors'
import { trackGoalCreated, trackGoalCompleted } from '@/lib/analytics'
import { Target, Plus, Pencil, Trash2, CheckCircle2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import type { Goal, GoalCategory, Expense } from '@/types'

function getProgressLevel(pct: number) {
  if (pct >= 100) return { color: '#fbbf24', textClass: 'text-amber-400', bgClass: 'bg-amber-400' }
  if (pct >= 76) return { color: '#22c55e', textClass: 'text-success-400', bgClass: 'bg-success-400' }
  if (pct >= 51) return { color: '#facc15', textClass: 'text-yellow-400', bgClass: 'bg-yellow-400' }
  if (pct >= 26) return { color: '#f97316', textClass: 'text-warning-400', bgClass: 'bg-warning-400' }
  return { color: '#ef4444', textClass: 'text-danger-400', bgClass: 'bg-danger-400' }
}

const CATEGORIES: { value: GoalCategory; label: string; emoji: string; color: string }[] = [
  { value: 'emergency_fund', label: 'Emergency Fund', emoji: '🛡️', color: '#f97316' },
  { value: 'laptop', label: 'Laptop', emoji: '💻', color: '#6366f1' },
  { value: 'bike', label: 'Bike', emoji: '🏍️', color: '#22c55e' },
  { value: 'education', label: 'Education', emoji: '📚', color: '#06b6d4' },
  { value: 'investment', label: 'Investment', emoji: '📈', color: '#8b5cf6' },
  { value: 'travel', label: 'Travel', emoji: '✈️', color: '#ec4899' },
  { value: 'other', label: 'Other', emoji: '🎯', color: '#71717a' },
]

const PRIORITIES = [
  { value: 'high', label: 'High', color: 'text-danger-400', bg: 'bg-danger-500/10' },
  { value: 'medium', label: 'Medium', color: 'text-warning-400', bg: 'bg-warning-500/10' },
  { value: 'low', label: 'Low', color: 'text-success-400', bg: 'bg-success-500/10' },
]

const HEALTH_BADGES: Record<GoalHealthStatus, { label: string; dot: string; className: string }> = {
  healthy:  { label: 'Healthy',   dot: '🟢', className: 'bg-success-500/10 text-success-400' },
  at_risk:  { label: 'At Risk',   dot: '🟡', className: 'bg-warning-500/10 text-warning-400' },
  critical: { label: 'Delayed',   dot: '🔴', className: 'bg-danger-500/10 text-danger-400' },
  done:     { label: 'Completed', dot: '✅', className: 'bg-brand-500/10 text-brand-300' },
}

const DEFAULT_FORM = {
  name: '',
  targetAmount: '',
  savedAmount: '',
  targetDate: '',
  priority: 'medium' as 'high' | 'medium' | 'low',
  monthlyContribution: '',
  category: 'other' as GoalCategory,
}

function validateForm(form: typeof DEFAULT_FORM): string | null {
  if (!form.name.trim()) return 'Please enter a goal name.'
  if (!form.targetAmount || Number(form.targetAmount) <= 0) return 'Target amount must be greater than 0.'
  if (form.savedAmount && Number(form.savedAmount) < 0) return 'Saved amount cannot be negative.'
  if (form.monthlyContribution && Number(form.monthlyContribution) < 0) return 'Monthly contribution cannot be negative.'
  if (Number(form.savedAmount) > Number(form.targetAmount)) return 'Saved amount cannot exceed the target amount.'
  return null
}

export default function GoalsPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const { watchAd, isUnlocked, consumeAd } = useAd()
  const [goals, setGoals] = useState<Goal[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(DEFAULT_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Goal | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!user) return
    console.log('🎯 [GoalsPage] Loading goals for user:', user.uid)
    
    const fetchGoals = getGoals(user.uid).catch(err => {
      console.error('❌ [GoalsPage] Error loading goals:', err)
      showToast(friendlyError(err, 'Could not load goals.'), 'error')
      return [] as Goal[]
    })
    const fetchExpenses = getExpenses(user.uid).catch(err => {
      console.error('❌ [GoalsPage] Error loading expenses:', err)
      showToast(friendlyError(err, 'Could not load expenses.'), 'error')
      return [] as Expense[]
    })

    Promise.all([fetchGoals, fetchExpenses])
      .then(([g, e]) => {
        console.log('🎯 [GoalsPage] Data loaded successfully. Goals count:', g.length, 'Expenses count:', e.length)
        setGoals(g)
        setExpenses(e)
      })
      .catch(err => {
        console.error('❌ [GoalsPage] Promise.all unexpected error:', err)
      })
      .finally(() => setLoading(false))
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  function openCreate() {
    setForm(DEFAULT_FORM)
    setFormError(null)
    setEditingId(null)
    setShowForm(true)
  }

  async function handleNewGoalClick() {
    if (isUnlocked('goal_creation')) {
      openCreate()
    } else {
      const success = await watchAd('goal_creation')
      if (success) {
        openCreate()
      }
    }
  }

  async function handleSuggestionClick(suggestion: { label: string; category: GoalCategory }) {
    if (isUnlocked('goal_creation')) {
      setForm({ ...DEFAULT_FORM, name: suggestion.label, category: suggestion.category })
      setFormError(null)
      setEditingId(null)
      setShowForm(true)
    } else {
      const success = await watchAd('goal_creation')
      if (success) {
        setForm({ ...DEFAULT_FORM, name: suggestion.label, category: suggestion.category })
        setFormError(null)
        setEditingId(null)
        setShowForm(true)
      }
    }
  }

  function openEdit(goal: Goal) {
    setForm({
      name: goal.name,
      targetAmount: String(goal.targetAmount),
      savedAmount: String(goal.savedAmount),
      targetDate: goal.targetDate,
      priority: goal.priority,
      monthlyContribution: String(goal.monthlyContribution),
      category: goal.category,
    })
    setFormError(null)
    setEditingId(goal.id)
    setShowForm(true)
  }

  async function handleSave() {
    if (!user) return
    const err = validateForm(form)
    if (err) { setFormError(err); return }

    setSaving(true)
    setFormError(null)
    const cat = CATEGORIES.find(c => c.value === form.category)
    const data = {
      name: form.name.trim(),
      targetAmount: Number(form.targetAmount),
      savedAmount: Number(form.savedAmount) || 0,
      targetDate: form.targetDate || new Date(Date.now() + 180 * 24 * 3600000).toISOString().split('T')[0],
      priority: form.priority,
      monthlyContribution: Number(form.monthlyContribution) || 0,
      category: form.category,
      color: cat?.color || '#6366f1',
    }

    try {
      if (editingId) {
        const previous = goals.find(g => g.id === editingId)
        await updateGoal(editingId, data)
        setGoals(prev => prev.map(g => g.id === editingId ? { ...g, ...data } : g))
        showToast('Goal updated.')

        // Track completion if it just crossed 100%
        if (previous && previous.savedAmount < previous.targetAmount && data.savedAmount >= data.targetAmount) {
          trackGoalCompleted(data.category, data.targetAmount)
          showToast(`🎉 "${data.name}" goal completed!`)
        }
      } else {
        const id = await createGoal(user.uid, data)
        setGoals(prev => [{ id, userId: user.uid, ...data, createdAt: new Date(), updatedAt: new Date() }, ...prev])
        trackGoalCreated(data.category, data.targetAmount)
        showToast('Goal created.')
        await consumeAd('goal_creation')
      }
      setShowForm(false)
    } catch (err) {
      setFormError(friendlyError(err, 'Could not save this goal. Please try again.'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteGoal(deleteTarget.id)
      setGoals(prev => prev.filter(g => g.id !== deleteTarget.id))
      showToast('Goal deleted.')
      setDeleteTarget(null)
    } catch (err) {
      showToast(friendlyError(err, 'Could not delete this goal.'), 'error')
    } finally {
      setDeleting(false)
    }
  }

  const totalSaved = goals.reduce((s, g) => s + g.savedAmount, 0)
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0)

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Goals</h1>
          <p className="text-surface-400 text-sm mt-1">
            {goals.length > 0
              ? `₹${totalSaved.toLocaleString('en-IN')} saved across ${goals.length} goals`
              : 'Create goals to start tracking your progress'}
          </p>
        </div>
        <button
          onClick={handleNewGoalClick}
          className="flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm px-4 py-2.5 rounded-xl transition-colors font-medium min-h-[44px] sm:min-h-0 sm:w-auto w-full"
        >
          {isUnlocked('goal_creation') ? (
            <><Plus size={16} /> New Goal</>
          ) : (
            <><Plus size={16} /> Watch Ad to Add Goal</>
          )}
        </button>
      </div>

      {/* ── Overall progress ── */}
      {goals.length > 0 && (
        <div className="glass rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3 gap-2">
            <p className="text-sm text-surface-400">Total progress</p>
            <p className="text-sm font-semibold text-right">
              ₹{totalSaved.toLocaleString('en-IN')} / ₹{totalTarget.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="h-2 bg-white/8 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full progress-bar"
              style={{
                width: `${totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0}%`,
                backgroundColor: getProgressLevel(totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0).color
              }}
            />
          </div>
          <p className="text-xs text-surface-500 mt-2">
            {totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0}% of total goals achieved
          </p>
        </div>
      )}

      {/* ── Goals Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="glass rounded-2xl h-48 shimmer" />)}
        </div>
      ) : goals.length === 0 ? (
        <div className="glass rounded-2xl p-8 sm:p-16 text-center">
          <Target size={40} className="text-surface-600 mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">No goals yet</h2>
          <p className="text-surface-400 text-sm mb-6 max-w-xs mx-auto">
            Create your first financial goal — emergency fund, laptop, bike, or anything you're saving for.
          </p>
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            {[
              { label: 'Emergency Fund', category: 'emergency_fund' as GoalCategory, emoji: '🛡️' },
              { label: 'Laptop', category: 'laptop' as GoalCategory, emoji: '💻' },
              { label: 'Education', category: 'education' as GoalCategory, emoji: '📚' },
              { label: 'Investment', category: 'investment' as GoalCategory, emoji: '📈' },
            ].map(suggestion => (
              <button
                key={suggestion.category}
                onClick={() => handleSuggestionClick(suggestion)}
                className="flex items-center gap-1.5 bg-white/5 hover:bg-white/8 border border-white/10 text-surface-300 text-xs px-3 py-2 rounded-xl transition-colors"
              >
                <span>{suggestion.emoji}</span> {suggestion.label}
              </button>
            ))}
          </div>
          <button
            onClick={handleNewGoalClick}
            className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm px-5 py-2.5 rounded-xl transition-colors font-medium min-h-[44px]"
          >
            {isUnlocked('goal_creation') ? (
              <><Plus size={16} /> Create your first goal</>
            ) : (
              <><Plus size={16} /> Watch Ad to Create Goal</>
            )}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {goals.map(goal => {
            const pct = Math.min(100, Math.round((goal.savedAmount / goal.targetAmount) * 100))
            const cat = CATEGORIES.find(c => c.value === goal.category)
            const priority = PRIORITIES.find(p => p.value === goal.priority)
            const remaining = Math.max(0, goal.targetAmount - goal.savedAmount)
            const completed = goal.savedAmount >= goal.targetAmount
            const health = getGoalHealthStatus(goal, expenses)
            const healthBadge = HEALTH_BADGES[health]
            const estCompletion = forecastDateLabel(goal)
            const progressColor = getProgressLevel(pct).color

            return (
              <div key={goal.id} className={`glass rounded-2xl p-5 ${completed ? 'border-success-500/20' : ''}`}>
                {/* Goal header */}
                <div className="flex items-start justify-between mb-4 gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                      style={{ backgroundColor: `${progressColor}20` }}
                    >
                      {cat?.emoji || '🎯'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-semibold text-surface-50 truncate">{goal.name}</h3>
                        {completed && <CheckCircle2 size={14} className="text-success-400 flex-shrink-0" />}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${priority?.bg} ${priority?.color}`}>
                          {priority?.label}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${healthBadge.className}`}>
                          {healthBadge.dot} {healthBadge.label}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => openEdit(goal)}
                      className="p-2 text-surface-600 hover:text-surface-300 rounded-lg hover:bg-white/5 transition-colors"
                      aria-label="Edit goal"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(goal)}
                      className="p-2 text-surface-600 hover:text-danger-400 rounded-lg hover:bg-danger-500/8 transition-colors"
                      aria-label="Delete goal"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Amount */}
                <div className="flex items-end justify-between mb-3 gap-2">
                  <div className="min-w-0">
                    <p className="text-2xl font-bold truncate" style={{ color: progressColor }}>
                      ₹{goal.savedAmount.toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-surface-500">of ₹{goal.targetAmount.toLocaleString('en-IN')}</p>
                  </div>
                  <p className="text-3xl font-bold flex-shrink-0 font-display" style={{ color: progressColor }}>{pct}%</p>
                </div>

                {/* Progress bar */}
                <div className="h-2 bg-white/8 rounded-full overflow-hidden mb-4">
                  <div
                    className="h-full rounded-full progress-bar"
                    style={{ width: `${pct}%`, backgroundColor: progressColor }}
                  />
                </div>

                {/* Forecast block */}
                <div className="bg-white/3 border border-white/6 rounded-xl p-3 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-[10px] text-surface-500 mb-1">Monthly</p>
                    <p className="text-xs font-semibold text-surface-300">
                      {goal.monthlyContribution > 0 ? `₹${goal.monthlyContribution.toLocaleString('en-IN')}` : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-surface-500 mb-1">Remaining</p>
                    <p className="text-xs font-semibold text-surface-300">₹{remaining.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-surface-500 mb-1">Est. completion</p>
                    <p className={`text-xs font-semibold ${completed ? 'text-success-400' : 'text-brand-300'}`}>
                      {completed ? 'Done 🎉' : estCompletion}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Create / Edit Modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative z-10 w-full sm:max-w-md glass rounded-t-2xl sm:rounded-2xl p-6 max-h-[92vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-6">{editingId ? 'Edit Goal' : 'New Goal'}</h2>

            {formError && (
              <div className="bg-danger-500/10 border border-danger-500/20 text-danger-400 text-sm rounded-xl px-4 py-3 mb-4">
                {formError}
              </div>
            )}

            <div className="space-y-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-2">Category</label>
                <div className="grid grid-cols-4 gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, category: cat.value }))}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-center transition-colors min-h-[56px] ${
                        form.category === cat.value
                          ? 'border-brand-500/50 bg-brand-500/10'
                          : 'border-white/8 bg-white/3 hover:bg-white/6'
                      }`}
                    >
                      <span className="text-lg">{cat.emoji}</span>
                      <span className="text-xs text-surface-400 leading-tight">{cat.label.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1.5">Goal name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g., Emergency Fund"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-surface-50 placeholder:text-surface-600 focus:border-brand-500/50"
                />
              </div>

              {/* Amounts */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-surface-400 mb-1.5">Target (₹)</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={form.targetAmount}
                    onChange={e => setForm(f => ({ ...f, targetAmount: e.target.value }))}
                    placeholder="50000"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-surface-50 placeholder:text-surface-600 focus:border-brand-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-surface-400 mb-1.5">Already saved (₹)</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={form.savedAmount}
                    onChange={e => setForm(f => ({ ...f, savedAmount: e.target.value }))}
                    placeholder="0"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-surface-50 placeholder:text-surface-600 focus:border-brand-500/50"
                  />
                </div>
              </div>

              {/* Monthly + Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-surface-400 mb-1.5">Monthly (₹)</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={form.monthlyContribution}
                    onChange={e => setForm(f => ({ ...f, monthlyContribution: e.target.value }))}
                    placeholder="5000"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-surface-50 placeholder:text-surface-600 focus:border-brand-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-surface-400 mb-1.5">Target date</label>
                  <input
                    type="date"
                    value={form.targetDate}
                    onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-surface-50 focus:border-brand-500/50"
                  />
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-2">Priority</label>
                <div className="flex gap-2">
                  {PRIORITIES.map(p => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, priority: p.value as Goal['priority'] }))}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-medium border transition-colors min-h-[40px] ${
                        form.priority === p.value
                          ? `${p.bg} ${p.color} border-current/30`
                          : 'border-white/8 bg-white/3 text-surface-400 hover:bg-white/6'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
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
                {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create goal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirmation ── */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete goal?"
        description={deleteTarget ? `"${deleteTarget.name}" and its progress will be permanently removed. This can't be undone.` : undefined}
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
