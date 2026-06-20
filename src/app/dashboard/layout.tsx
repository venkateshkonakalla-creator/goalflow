'use client'
// src/app/dashboard/layout.tsx
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import {
  LayoutDashboard, Target, Receipt, BarChart3, CalendarDays,
  TrendingUp, LogOut, Menu, X, Zap, Calculator
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
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

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

        <main className="flex-1 overflow-y-auto overflow-x-hidden w-full">
          {children}
        </main>
      </div>
    </div>
  )
}
