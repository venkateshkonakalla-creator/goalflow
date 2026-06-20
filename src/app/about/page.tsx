import type { Metadata } from 'next'
import Link from 'next/link'
import { Target, TrendingUp, Shield, Activity, Sparkles } from 'lucide-react'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'About Us — GoalFlow',
  description: 'Learn about our mission to help you take control of your personal finances, track your savings, and build wealth.',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-surface-950 text-surface-50 flex flex-col">
      {/* Navbar */}
      <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 sticky top-0 bg-surface-950/80 backdrop-blur-md z-30">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
            <TrendingUp size={16} className="text-white" />
          </div>
          <span className="font-semibold text-lg tracking-tight">GoalFlow</span>
        </Link>
        <Link href="/dashboard" className="text-xs bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-xl transition-colors font-medium">
          Dashboard
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-4xl mx-auto px-6 py-12 sm:py-20 flex flex-col justify-center">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-4 text-white">
            Stop Wondering Where Your Salary Went
          </h1>
          <p className="text-surface-400 text-base sm:text-lg leading-relaxed">
            GoalFlow was built to give you absolute clarity over your personal finances. We believe budget planning shouldn't be tedious, and goal tracking should feel rewarding.
          </p>
        </div>

        {/* Core Values / Features */}
        <div className="grid sm:grid-cols-2 gap-6 mb-16">
          <div className="glass rounded-3xl p-6 sm:p-8 border border-white/5">
            <div className="w-10 h-10 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 mb-4">
              <Target size={20} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Goal-Oriented Allocations</h3>
            <p className="text-sm text-surface-400 leading-relaxed">
              Plan your savings allocation before spending. Connect every rupee directly to a specific target like an emergency fund, travel plan, or new gear.
            </p>
          </div>

          <div className="glass rounded-3xl p-6 sm:p-8 border border-white/5">
            <div className="w-10 h-10 rounded-2xl bg-success-500/10 border border-success-500/20 flex items-center justify-center text-success-400 mb-4">
              <Activity size={20} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Immediate Goal Impact Analysis</h3>
            <p className="text-sm text-surface-400 leading-relaxed">
              Understand the true cost of purchases. GoalFlow calculates exactly how many days a new expense will delay your primary financial goals.
            </p>
          </div>

          <div className="glass rounded-3xl p-6 sm:p-8 border border-white/5">
            <div className="w-10 h-10 rounded-2xl bg-warning-500/10 border border-warning-500/20 flex items-center justify-center text-warning-400 mb-4">
              <Shield size={20} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Private & Secure</h3>
            <p className="text-sm text-surface-400 leading-relaxed">
              Your financial data is yours alone. Secured by Firebase Authentication and Cloud Firestore rules, ensuring private and safe access anytime.
            </p>
          </div>

          <div className="glass rounded-3xl p-6 sm:p-8 border border-white/5">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
              <Sparkles size={20} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Affordability Engine</h3>
            <p className="text-sm text-surface-400 leading-relaxed">
              Use our "Can I Afford This?" engine to instantly review whether a major spending decision aligns with your monthly income and savings rate.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="glass rounded-3xl p-8 sm:p-12 text-center border border-brand-500/15 relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-brand-500/10 rounded-full blur-3xl" />
          <h2 className="text-2xl font-bold text-white mb-3 relative z-10">Start Tracking Smarter Today</h2>
          <p className="text-sm text-surface-400 max-w-sm mx-auto mb-6 relative z-10 leading-relaxed">
            Join thousands of smart planners taking full control of their monthly salary structure.
          </p>
          <Link href="/dashboard" className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors relative z-10 shadow-glow min-h-[44px]">
            Go to Dashboard
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}
