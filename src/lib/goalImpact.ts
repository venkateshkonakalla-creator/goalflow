// src/lib/goalImpact.ts
// ─── GOAL IMPACT ENGINE ────────────────────────────────────────────────────────
// This is GoalFlow's core differentiator.
// For any expense, it calculates which goal is most affected,
// how many days the goal is delayed, and surfaces this to the user.

import type { Goal, Expense, GoalImpact, Allocation, ExpenseCategory } from '@/types'
import { differenceInDays, parseISO } from 'date-fns'

/**
 * Calculate how a given expense amount delays a specific goal.
 * @param goal         The goal to evaluate
 * @param expenseAmount Amount of the expense in ₹
 * @returns Number of days delayed
 */
export function calculateDaysDelayed(goal: Goal, expenseAmount: number): number {
  if (goal.monthlyContribution <= 0) return 0
  const dailyRate = goal.monthlyContribution / 30
  if (dailyRate <= 0) return 0
  return Math.ceil(expenseAmount / dailyRate)
}

/**
 * Given an expense, find which goal is most impacted and calculate the delay.
 * Priority order: high > medium > low
 */
export function calculateGoalImpact(
  expense: Expense,
  goals: Goal[],
  allocations: Allocation[]
): GoalImpact | null {
  if (!goals.length) return null

  // Sort goals: incomplete ones first, by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  const activeGoals = goals
    .filter(g => g.savedAmount < g.targetAmount)
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  if (!activeGoals.length) return null

  // Find goal with highest monthly contribution (most affected by diversion)
  const primaryGoal = activeGoals.reduce((best, g) =>
    g.monthlyContribution > best.monthlyContribution ? g : best
  , activeGoals[0])

  const daysDelayed = calculateDaysDelayed(primaryGoal, expense.amount)

  return {
    goalId: primaryGoal.id,
    goalName: primaryGoal.name,
    daysDelayed,
    amountDiverted: expense.amount,
  }
}

/**
 * Get a human-friendly impact message for an expense.
 */
export function getImpactMessage(impact: GoalImpact, expenseCategory: string): string {
  const categoryEmoji: Record<string, string> = {
    food: '🍽️',
    travel: '🚌',
    shopping: '🛍️',
    entertainment: '🎮',
    education: '📚',
    health: '💊',
    other: '💸',
  }
  const emoji = categoryEmoji[expenseCategory] || '💸'

  if (impact.daysDelayed === 0) {
    return `${emoji} This expense has minimal impact on your goals.`
  }
  if (impact.daysDelayed === 1) {
    return `${emoji} Your "${impact.goalName}" goal is delayed by 1 day.`
  }
  return `${emoji} Your "${impact.goalName}" goal is now delayed by ${impact.daysDelayed} days.`
}

/**
 * Calculate the overall savings rate for a month.
 */
export function calculateSavingsRate(income: number, totalExpenses: number): number {
  if (income <= 0) return 0
  const saved = income - totalExpenses
  return Math.max(0, Math.round((saved / income) * 100))
}

/**
 * Predict goal completion date given current savings rate.
 */
export function predictCompletionDate(goal: Goal): Date | null {
  const remaining = goal.targetAmount - goal.savedAmount
  if (remaining <= 0) return new Date()
  if (goal.monthlyContribution <= 0) return null

  const monthsNeeded = Math.ceil(remaining / goal.monthlyContribution)
  const date = new Date()
  date.setMonth(date.getMonth() + monthsNeeded)
  return date
}

/**
 * Calculate goal health score (0–100).
 */
export function calculateGoalHealth(goal: Goal): number {
  const targetDate = parseISO(goal.targetDate)
  const today = new Date()
  const totalDays = differenceInDays(targetDate, new Date(goal.createdAt instanceof Date ? goal.createdAt : new Date()))
  const daysRemaining = differenceInDays(targetDate, today)

  if (daysRemaining <= 0) return goal.savedAmount >= goal.targetAmount ? 100 : 0

  const progressPercent = (goal.savedAmount / goal.targetAmount) * 100
  const timeElapsedPercent = totalDays > 0 ? ((totalDays - daysRemaining) / totalDays) * 100 : 0

  // Health = how close progress is to where it should be
  const expectedProgress = timeElapsedPercent
  const health = Math.min(100, Math.round((progressPercent / Math.max(1, expectedProgress)) * 100))
  return health
}

// ─── GOAL FORECASTING ──────────────────────────────────────────────────────────

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

/**
 * Human-friendly forecast label for when a goal will be completed,
 * e.g. "October 2026" or "Completed".
 */
export function forecastDateLabel(goal: Goal): string {
  const remaining = goal.targetAmount - goal.savedAmount
  if (remaining <= 0) return 'Completed'
  if (goal.monthlyContribution <= 0) return '—'

  const monthsNeeded = Math.ceil(remaining / goal.monthlyContribution)
  const date = new Date()
  date.setMonth(date.getMonth() + monthsNeeded)
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`
}

// ─── GOAL HEALTH STATUS ────────────────────────────────────────────────────────

export type GoalHealthStatus = 'healthy' | 'at_risk' | 'critical' | 'done'

/**
 * Categorize a goal's health based on progress rate and accumulated delays
 * from logged expenses.
 *  - "done"     : target reached
 *  - "healthy"  : on pace, minimal delay (🟢)
 *  - "at_risk"  : moderate delay or below-pace progress (🟡)
 *  - "critical" : significant delay or far behind pace (🔴)
 */
export function getGoalHealthStatus(goal: Goal, expenses: Expense[]): GoalHealthStatus {
  const remaining = goal.targetAmount - goal.savedAmount
  if (remaining <= 0) return 'done'

  const progressPct = goal.savedAmount / goal.targetAmount
  const totalDelay = expenses
    .filter(e => e.goalImpact?.goalId === goal.id)
    .reduce((sum, e) => sum + (e.goalImpact?.daysDelayed || 0), 0)

  if (totalDelay > 20 || progressPct < 0.15) return 'critical'
  if (totalDelay > 8 || progressPct < 0.35) return 'at_risk'
  return 'healthy'
}

// ─── DASHBOARD STATUS SYSTEM ───────────────────────────────────────────────────

export type DashboardStatusType = 'on_track' | 'behind' | 'critical'

export interface DashboardStatus {
  type: DashboardStatusType
  icon: string
  title: string
  message: string
}

/**
 * Compute the top-level dashboard status banner.
 *  - "on_track" : zero goal delay this month and savings rate >= 40% (✅ green)
 *  - "behind"   : some delay accumulated but under 20 days total (⚠️ orange)
 *  - "critical" : 20+ days of accumulated delay (🚨 red)
 */
export function getDashboardStatus(
  goals: Goal[],
  income: number,
  totalExpenses: number,
  expenses: Expense[]
): DashboardStatus {
  const rate = calculateSavingsRate(income, totalExpenses)

  const totalDelay = goals.reduce((sum, g) => {
    const goalDelay = expenses
      .filter(e => e.goalImpact?.goalId === g.id)
      .reduce((s, e) => s + (e.goalImpact?.daysDelayed || 0), 0)
    return sum + goalDelay
  }, 0)

  // Find the goal with the most accumulated delay (for critical messaging)
  const mostDelayed = goals.reduce<{ goal?: Goal; delay: number }>((worst, g) => {
    const delay = expenses
      .filter(e => e.goalImpact?.goalId === g.id)
      .reduce((s, e) => s + (e.goalImpact?.daysDelayed || 0), 0)
    return delay > worst.delay ? { goal: g, delay } : worst
  }, { delay: 0 })

  if (totalDelay === 0 && rate >= 40) {
    const primaryGoal = goals[0]
    return {
      type: 'on_track',
      icon: '✅',
      title: 'On Track',
      message: primaryGoal
        ? `You are on track to reach your ${primaryGoal.name} by ${forecastDateLabel(primaryGoal)}.`
        : 'You are on track with your financial plan this month.',
    }
  }

  if (totalDelay < 20) {
    return {
      type: 'behind',
      icon: '⚠️',
      title: 'Behind Schedule',
      message: `You are currently ${totalDelay} day${totalDelay === 1 ? '' : 's'} behind your savings targets this month.`,
    }
  }

  return {
    type: 'critical',
    icon: '🚨',
    title: 'Critical Alert',
    message: `At your current spending rate, your ${mostDelayed.goal?.name || 'goal'} target will be delayed by ${Math.ceil(totalDelay / 30)} month${Math.ceil(totalDelay / 30) === 1 ? '' : 's'}.`,
  }
}

// ─── IMPACT SUMMARY (for the dedicated Impact page) ───────────────────────────

export interface ImpactSummary {
  totalDaysLost: number
  mostAffectedGoal: { name: string; days: number } | null
  biggestDelayExpense: Expense | null
  goalDelayBreakdown: { goalId: string; goalName: string; color: string; days: number }[]
  categoryDelayBreakdown: { category: ExpenseCategory; days: number; amount: number }[]
}

/**
 * Build the full "Impact" page summary: total days lost this month,
 * the most affected goal, the single biggest delaying purchase,
 * and breakdowns by goal and by category.
 */
export function getImpactSummary(expenses: Expense[], goals: Goal[]): ImpactSummary {
  const impactExpenses = expenses.filter(e => (e.goalImpact?.daysDelayed || 0) > 0)
  const totalDaysLost = impactExpenses.reduce((s, e) => s + (e.goalImpact?.daysDelayed || 0), 0)

  const goalDelayBreakdown = goals
    .map(g => ({
      goalId: g.id,
      goalName: g.name,
      color: g.color,
      days: expenses
        .filter(e => e.goalImpact?.goalId === g.id)
        .reduce((s, e) => s + (e.goalImpact?.daysDelayed || 0), 0),
    }))
    .filter(g => g.days > 0)
    .sort((a, b) => b.days - a.days)

  const biggestDelayExpense = [...impactExpenses].sort(
    (a, b) => (b.goalImpact?.daysDelayed || 0) - (a.goalImpact?.daysDelayed || 0)
  )[0] || null

  const categories: ExpenseCategory[] = ['food','travel','shopping','entertainment','education','health','other']
  const categoryDelayBreakdown = categories
    .map(category => ({
      category,
      days: impactExpenses
        .filter(e => e.category === category)
        .reduce((s, e) => s + (e.goalImpact?.daysDelayed || 0), 0),
      amount: impactExpenses
        .filter(e => e.category === category)
        .reduce((s, e) => s + e.amount, 0),
    }))
    .filter(c => c.days > 0)
    .sort((a, b) => b.days - a.days)

  return {
    totalDaysLost,
    mostAffectedGoal: goalDelayBreakdown[0]
      ? { name: goalDelayBreakdown[0].goalName, days: goalDelayBreakdown[0].days }
      : null,
    biggestDelayExpense,
    goalDelayBreakdown,
    categoryDelayBreakdown,
  }
}

// ─── PREMIUM AFFORDABILITY CALCULATOR ──────────────────────────────────────────

export interface AffordabilityResult {
  itemName: string
  cost: number
  canAfford: boolean
  moneyRemainingBefore: number
  moneyRemainingAfter: number
  savingsRateBefore: number
  savingsRateAfter: number
  /** Per-goal before/after forecast, sorted by priority (highest first). */
  goalForecasts: {
    goalId: string
    goalName: string
    priority: Goal['priority']
    color: string
    completionBefore: string
    completionAfter: string
    delayDays: number
  }[]
  recommendation: string
}

const PRIORITY_RANK: Record<Goal['priority'], number> = { high: 0, medium: 1, low: 2 }

/**
 * Premium "Can I Afford This?" calculation. Compares the user's current
 * financial trajectory against the trajectory after making a purchase,
 * showing before/after completion dates, savings rate impact, and a
 * plain-language recommendation.
 */
export function calculateAffordability(
  itemName: string,
  cost: number,
  income: number,
  totalExpenses: number,
  totalAllocated: number,
  goals: Goal[]
): AffordabilityResult {
  const moneyRemainingBefore = income - totalExpenses - totalAllocated
  const moneyRemainingAfter = moneyRemainingBefore - cost
  const canAfford = moneyRemainingAfter >= 0

  const savingsRateBefore = calculateSavingsRate(income, totalExpenses)
  const savingsRateAfter = calculateSavingsRate(income, totalExpenses + cost)

  const activeGoals = goals
    .filter(g => g.savedAmount < g.targetAmount && g.monthlyContribution > 0)
    .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority])

  const goalForecasts = activeGoals.map(g => {
    const delayDays = calculateDaysDelayed(g, cost)
    // Simulate the "after" goal by reducing savedAmount by the diverted cost
    // (i.e. this money would have otherwise gone toward the goal).
    const afterGoal: Goal = {
      ...g,
      savedAmount: Math.max(0, g.savedAmount - cost),
    }
    return {
      goalId: g.id,
      goalName: g.name,
      priority: g.priority,
      color: g.color,
      completionBefore: forecastDateLabel(g),
      completionAfter: forecastDateLabel(afterGoal),
      delayDays,
    }
  })

  // Build recommendation
  let recommendation: string
  const topGoal = goalForecasts[0]
  if (!canAfford) {
    recommendation = `Not recommended — this exceeds your remaining budget by ₹${Math.abs(moneyRemainingAfter).toLocaleString('en-IN')} this month.`
  } else if (topGoal && topGoal.priority === 'high' && topGoal.delayDays > 0) {
    recommendation = `Not recommended if ${topGoal.goalName} is your highest priority goal — it will be delayed by ${topGoal.delayDays} day${topGoal.delayDays === 1 ? '' : 's'}.`
  } else if (savingsRateAfter < savingsRateBefore - 15) {
    recommendation = `Proceed with caution — your savings rate would drop by ${savingsRateBefore - savingsRateAfter} percentage points this month.`
  } else {
    recommendation = `Looks affordable — your goals stay on track and you'll still have ₹${moneyRemainingAfter.toLocaleString('en-IN')} left this month.`
  }

  return {
    itemName,
    cost,
    canAfford,
    moneyRemainingBefore,
    moneyRemainingAfter,
    savingsRateBefore,
    savingsRateAfter,
    goalForecasts,
    recommendation,
  }
}


// This section prepares the architecture for future AI integration.
// When ready, replace the stub implementations with Gemini API calls.

export interface AIAffordabilityCheck {
  canAfford: boolean
  confidence: number
  reasoning: string
  goalImpacts: GoalImpact[]
  suggestion?: string
}

/**
 * FUTURE: Check if user can afford a purchase given their goals.
 * Currently returns a rule-based answer. Will use Gemini when enabled.
 */
export async function checkAffordability(
  amount: number,
  description: string,
  monthlyIncome: number,
  goals: Goal[],
  currentMonthExpenses: number,
  allocations: Allocation[]
): Promise<AIAffordabilityCheck> {
  // Rule-based stub — replace with Gemini API call
  const remaining = monthlyIncome - currentMonthExpenses - allocations.reduce((s, a) => s + a.amount, 0)
  const canAfford = remaining >= amount

  const impacts: GoalImpact[] = goals
    .filter(g => g.savedAmount < g.targetAmount)
    .map(g => ({
      goalId: g.id,
      goalName: g.name,
      daysDelayed: calculateDaysDelayed(g, amount),
      amountDiverted: amount,
    }))
    .filter(i => i.daysDelayed > 0)
    .slice(0, 2)

  return {
    canAfford,
    confidence: 0.8,
    reasoning: canAfford
      ? `You have ₹${remaining.toLocaleString('en-IN')} available this month.`
      : `This would exceed your remaining budget of ₹${remaining.toLocaleString('en-IN')}.`,
    goalImpacts: impacts,
    suggestion: canAfford ? undefined : 'Consider waiting until next month or reducing another expense.',
  }
}
