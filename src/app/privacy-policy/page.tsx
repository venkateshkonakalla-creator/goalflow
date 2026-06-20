import type { Metadata } from 'next'
import Link from 'next/link'
import { TrendingUp, ShieldCheck } from 'lucide-react'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Privacy Policy — GoalFlow',
  description: 'Understand how we protect, collect, and handle your personal and financial data on GoalFlow.',
}

export default function PrivacyPolicyPage() {
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
            <ShieldCheck size={20} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Privacy Policy</h1>
            <p className="text-xs text-surface-500 mt-1">Last Updated: June 20, 2026</p>
          </div>
        </div>

        <div className="glass rounded-3xl p-6 sm:p-8 border border-white/5 space-y-6 text-sm text-surface-300 leading-relaxed">
          <section>
            <h2 className="text-base font-bold text-white mb-2">1. Introduction</h2>
            <p>
              Welcome to GoalFlow. We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about our policy, or our practices with regards to your personal information, please contact us.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2">2. Information We Collect</h2>
            <p className="mb-2">
              We collect personal information that you voluntarily provide to us when registering at GoalFlow. This includes:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Account Credentials</strong>: Email addresses, passwords, and display names via Firebase Authentication.</li>
              <li><strong>Financial Logs</strong>: Goals, targets, saved amounts, income, expenses, and allocations. This data is private and locked to your personal UID.</li>
              <li><strong>Ad-Gating Activity</strong>: Logs of ad starts, completions, and feature unlocks for operational monetization tracking.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2">3. How We Use Your Information</h2>
            <p className="mb-2">We use the information we collect to provide, improve, and secure our services, specifically to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Manage your account and preferences.</li>
              <li>Perform math calculations for goal forecasting, spending impact analysis, and affordability checks.</li>
              <li>Analyze user engagement via Google Analytics to optimize features.</li>
              <li>Verify rewarded ad interactions to unlock dashboard features.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2">4. Third-Party Services</h2>
            <p className="mb-2">
              We work with trusted third-party providers to execute backend services and advertising. These include:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Google Firebase</strong>: Handles email/Google login, Firestore databases, and serverless hosting infrastructure. See Google's Privacy Policy.</li>
              <li><strong>Adsterra Network</strong>: Delivers sponsored banner and social bar ads, as well as rewarded smartlinks. Adsterra may collect standard telemetry, IP addresses, and browser cookies to serve contextually relevant ads.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2">5. Data Retention & Deletion</h2>
            <p>
              We retain your financial data in Cloud Firestore for as long as your account remains active. You have the right to request deletion of your account and all associated financial records at any time by contacting us directly.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2">6. Security of Your Data</h2>
            <p>
              We implement strict security checks, including Firebase Security Rules, to verify that only authenticated owners can read or write their personal budget documents. However, please remember that no transmission over the internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2">7. Contact Us</h2>
            <p>
              If you have any questions or feedback regarding this Privacy Policy, please reach out to us using our <Link href="/contact" className="text-brand-400 hover:text-brand-300 underline font-medium">Contact Form</Link>.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
