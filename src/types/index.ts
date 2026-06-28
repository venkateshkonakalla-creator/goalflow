// src/types/index.ts
export interface User {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  createdAt: Date
}

export interface Goal {
  id: string
  userId: string
  name: string
  targetAmount: number
  savedAmount: number
  targetDate: string
  priority: 'high' | 'medium' | 'low'
  monthlyContribution: number
  category: GoalCategory
  color: string
  createdAt: Date
  updatedAt: Date
}

export type GoalCategory =
  | 'emergency_fund'
  | 'laptop'
  | 'bike'
  | 'education'
  | 'investment'
  | 'travel'
  | 'other'

export interface Expense {
  id: string
  userId: string
  amount: number
  category: ExpenseCategory
  description: string
  date: string
  goalImpact?: GoalImpact
  createdAt: Date
}

export type ExpenseCategory =
  | 'food'
  | 'travel'
  | 'shopping'
  | 'entertainment'
  | 'education'
  | 'health'
  | 'other'

export interface GoalImpact {
  goalId: string
  goalName: string
  daysDelayed: number
  amountDiverted: number
}

export interface Income {
  id: string
  userId: string
  amount: number
  month: string // YYYY-MM format
  source: string
  createdAt: Date
}

export interface Allocation {
  id: string
  userId: string
  month: string // YYYY-MM format
  goalId: string
  goalName: string
  amount: number
  kind?: 'goal' | 'custom'
  createdAt: Date
}

export interface MonthlyPlanRecord {
  id: string
  userId: string
  month: string
  income: number
  allocations: Allocation[]
  totalAllocated: number
  remaining: number
  mode: 'goal' | 'custom'
  createdAt: Date
  updatedAt: Date
}

export interface MonthlySummary {
  id: string
  userId: string
  month: string
  income: number
  expenses: number
  saved: number
  savingsRate: number
  goalContributions: number
  remainingSalary: number
  createdAt: Date
  updatedAt: Date
}

export interface PendingContribution {
  id: string
  userId: string
  month: string
  goalId: string
  goalName: string
  amount: number
  status: 'pending' | 'completed'
  createdAt: Date
  updatedAt: Date
}

export interface DashboardStats {
  monthlyIncome: number
  savingsRate: number
  totalGoals: number
  moneyRemaining: number
  totalSaved: number
  monthlyExpenses: number
}

// AI Feature Architecture (future Gemini integration)
export interface AIQuery {
  type: 'afford_check' | 'goal_impact' | 'budget_advice'
  userId: string
  question: string
  context: {
    income: number
    goals: Goal[]
    expenses: Expense[]
    allocations: Allocation[]
  }
}

export interface AIResponse {
  answer: string
  recommendation: string
  impact?: GoalImpact[]
  confidence: number
}
