'use client'
// src/app/dashboard/layout.tsx
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { saveFeedback } from '@/lib/adService'
import SocialBarAd from '@/components/SocialBarAd'
import Footer from '@/components/Footer'
import {
  LayoutDashboard, Target, Receipt, BarChart3, CalendarDays,
  TrendingUp, LogOut, Menu, X, Zap, Calculator, MessageSquare, Star
} from 'lucide-react'


const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/goals', label: 'Goals', icon: Target },
  { href: '/dashboard/impact', label: 'Impact', icon: Zap },
  { href: '/dashboard/afford', label: 'Afford?', icon: Calculator },
  { href: '/dashboard/expenses', label: 'Expenses', icon: Receipt },
  { href: '/dashboard/planning', label: 'Planning', icon: CalendarDays },
  { href: '/dashboard/analytics', label: 'Insights', icon: BarChart3 },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logOut } = useAuth()
  const { showToast } = useToast()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Feedback states
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedbackRating, setFeedbackRating] = useState(0)
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackEmail, setFeedbackEmail] = useState('')
  const [submittingFeedback, setSubmittingFeedback] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login')
  }, [user, loading, router])

  // Close mobile sidebar whenever the route changes
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  if (loading) return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center animate-pulse">
          <TrendingUp size={20} className="text-white" />
        </div>
        <p className="text-surface-500 text-sm">Loading GoalFlow…</p>
      </div>
    </div>
  )

  if (!user) return null

  const initials = user.displayName
    ? user.displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : (user.email?.[0] || 'U').toUpperCase()

  async function handleLogout() {
    await logOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-surface-950 flex">
      {/* ── Sidebar ── */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 max-w-[80vw] bg-surface-950 border-r border-white/5 flex flex-col
        transform transition-transform duration-200 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 lg:w-60 lg:max-w-none
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center">
              <TrendingUp size={14} className="text-white" />
            </div>
            <span className="font-semibold text-base tracking-tight">GoalFlow</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden ml-auto text-surface-500 hover:text-surface-300 p-2 -mr-2"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV.map(item => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-3 lg:py-2.5 rounded-xl text-sm font-medium transition-colors
                  ${active
                    ? 'bg-brand-500/15 text-brand-300'
                    : 'text-surface-400 hover:text-surface-200 hover:bg-white/4'
                  }
                `}
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-white/5 flex-shrink-0">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/4 transition-colors">
            <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center text-xs font-bold text-brand-300 flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-surface-200 truncate">
                {user.displayName || 'User'}
              </p>
              <p className="text-xs text-surface-500 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-3 lg:py-2.5 rounded-xl text-sm text-surface-500 hover:text-danger-400 hover:bg-danger-500/8 transition-colors mt-1"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0 w-full">
        <SocialBarAd />
        {/* Top bar (mobile) */}
        <header className="lg:hidden h-14 border-b border-white/5 flex items-center justify-between px-3 flex-shrink-0 sticky top-0 bg-surface-950/90 backdrop-blur-md z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-surface-400 hover:text-surface-200 p-2 -ml-1"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-brand-500 flex items-center justify-center">
              <TrendingUp size={12} className="text-white" />
            </div>
            <span className="font-semibold text-sm">GoalFlow</span>
          </div>
          <div className="w-8" />
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden w-full flex flex-col">
          <div className="flex-1">
            {children}
          </div>
          <Footer />
        </main>
      </div>

      {/* ── Feedback Button ── */}
      <button
        onClick={() => setFeedbackOpen(true)}
        className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2.5 rounded-full shadow-lg shadow-brand-500/20 hover:shadow-brand-500/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200 font-medium text-sm border border-brand-400/20"
      >
        <MessageSquare size={16} />
        <span>Feedback</span>
      </button>

      {/* ── Feedback Modal ── */}
      {feedbackOpen && (
        <div className="fixed inset-0 z-[250] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => { if (!submittingFeedback) setFeedbackOpen(false) }}
          />
          <div className="relative z-10 w-full sm:max-w-md glass rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 max-h-[92vh] overflow-y-auto border border-white/10 shadow-glow animate-slide-up">
            <button
              onClick={() => setFeedbackOpen(false)}
              disabled={submittingFeedback}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-surface-400 hover:text-surface-200 hover:bg-white/5 transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>

            <h2 className="text-xl font-bold mb-1 text-surface-50">Share your thoughts</h2>
            <p className="text-xs text-surface-400 mb-6">
              We'd love to hear your feedback to make GoalFlow even better.
            </p>

            <form onSubmit={async (e) => {
              e.preventDefault()
              if (feedbackRating === 0) {
                showToast('Please select a rating.', 'error')
                return
              }
              if (!feedbackText.trim()) {
                showToast('Please enter your feedback comments.', 'error')
                return
              }
              setSubmittingFeedback(true)
              try {
                await saveFeedback(user?.uid || null, {
                  rating: feedbackRating,
                  message: feedbackText.trim(),
                  email: feedbackEmail.trim() || undefined
                })
                showToast('Feedback submitted. Thank you! 👋', 'success')
                setFeedbackRating(0)
                setFeedbackText('')
                setFeedbackEmail('')
                setFeedbackOpen(false)
              } catch (err) {
                showToast('Could not save feedback. Please try again.', 'error')
              } finally {
                setSubmittingFeedback(false)
              }
            }} className="space-y-5">
              {/* Rating Star Selection */}
              <div>
                <label className="block text-xs font-semibold text-surface-400 mb-2 uppercase tracking-wider">
                  Rating
                </label>
                <div className="flex gap-2.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackRating(star)}
                      disabled={submittingFeedback}
                      className="p-1 hover:scale-110 active:scale-95 transition-all text-yellow-500"
                    >
                      <Star
                        size={28}
                        className="transition-colors"
                        fill={feedbackRating >= star ? '#eab308' : 'none'}
                        strokeWidth={1.5}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Feedback Text */}
              <div>
                <label className="block text-xs font-semibold text-surface-400 mb-1.5 uppercase tracking-wider">
                  Feedback comments
                </label>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  disabled={submittingFeedback}
                  placeholder="What is working well? What could we improve?"
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-surface-50 placeholder:text-surface-600 focus:border-brand-500/50 resize-none"
                  required
                />
              </div>

              {/* Optional Email */}
              <div>
                <label className="block text-xs font-semibold text-surface-400 mb-1.5 uppercase tracking-wider">
                  Email (optional)
                </label>
                <input
                  type="email"
                  value={feedbackEmail}
                  onChange={(e) => setFeedbackEmail(e.target.value)}
                  disabled={submittingFeedback}
                  placeholder="your.email@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-surface-50 placeholder:text-surface-600 focus:border-brand-500/50"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setFeedbackOpen(false)}
                  disabled={submittingFeedback}
                  className="flex-1 bg-white/5 hover:bg-white/8 border border-white/10 text-surface-300 py-3 rounded-xl text-sm transition-colors font-medium min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingFeedback}
                  className="flex-1 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 min-h-[44px]"
                >
                  {submittingFeedback ? 'Sending…' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
