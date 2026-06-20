import type { Metadata } from 'next'
import Link from 'next/link'
import { TrendingUp, FileText } from 'lucide-react'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Terms & Conditions — GoalFlow',
  description: 'Review the terms of service, guidelines, and disclaimers for using GoalFlow personal finance planner.',
}

export default function TermsPage() {
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
      <main className="flex-grow max-w-3xl mx-auto px-6 py-12 sm:py-16">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
            <FileText size={20} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Terms & Conditions</h1>
            <p className="text-xs text-surface-500 mt-1">Last Updated: June 20, 2026</p>
          </div>
        </div>

        <div className="glass rounded-3xl p-6 sm:p-8 border border-white/5 space-y-6 text-sm text-surface-300 leading-relaxed">
          <section>
            <h2 className="text-base font-bold text-white mb-2">1. Acceptance of Terms</h2>
            <p>
              By accessing or using GoalFlow, you agree to be bound by these Terms and Conditions and our Privacy Policy. If you disagree with any part of these terms, you do not have permission to access the website or use the dashboard.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2">2. User Accounts & Registration</h2>
            <p>
              When you create an account, you must guarantee that the information you provide is accurate, complete, and current at all times. Inaccurate or obsolete information may lead to immediate termination of your account. You are responsible for maintaining the confidentiality of your account credentials.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2">3. Platform Services & Accuracy Disclaimers</h2>
            <p className="mb-2">
              GoalFlow provides calculations, metrics, and forecasts to help you manage your finances. However:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Not Financial Advice</strong>: All metrics, score calculations, and goal impacts are for informational purposes only and should not be treated as professional financial advice.</li>
              <li><strong>No Guarantees</strong>: Forecasts are mathematical projections based on historical logs and current income structures. Actual financial events may vary.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2">4. Monetization & Ad Gating</h2>
            <p>
              GoalFlow provides free-tier usage (including the first goal creation, first affordability checker, and first monthly planner generation). Subsequent accesses to these features require watching sponsored reward ads. Third-party advertisements are served via Adsterra, which handles all ad rendering, tracking, and cookie profiling. We do not endorse the products advertised, and clicking on ads opens external, third-party sites at your own risk.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2">5. Prohibited Activities</h2>
            <p>
              You agree not to attempt to bypass access controls, exploit authentication tokens, inject malicious scripts, or run automated scripts to abuse database writes. Failure to comply may result in temporary blocklisting or permanent deletion of your Firebase credentials.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2">6. Limitation of Liability</h2>
            <p>
              In no event shall GoalFlow, nor its creators, be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or financial assets, arising out of your use of or inability to use the platform.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2">7. Changes to Terms</h2>
            <p>
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will indicate the "Last Updated" date at the top of this document. Continued use of GoalFlow following any changes constitutes acceptance of the new terms.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
