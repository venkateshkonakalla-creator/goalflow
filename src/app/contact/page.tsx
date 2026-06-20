import type { Metadata } from 'next'
import Link from 'next/link'
import { TrendingUp, MessageSquare } from 'lucide-react'
import ContactForm from './ContactForm'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Contact Us — GoalFlow',
  description: 'Have questions or suggestions? Get in touch with the GoalFlow team today.',
}

export default function ContactPage() {
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
      <main className="flex-grow max-w-lg mx-auto w-full px-6 py-12 sm:py-16 flex flex-col justify-center">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
            <MessageSquare size={20} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Get in touch</h1>
            <p className="text-xs text-surface-500 mt-1">We typically reply within 24 hours.</p>
          </div>
        </div>

        <ContactForm />
      </main>

      <Footer />
    </div>
  )
}
