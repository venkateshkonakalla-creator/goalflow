'use client'

import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-surface-950 py-8 px-4 sm:px-6 w-full mt-auto">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-col items-center sm:items-start">
          <Link href="/" className="text-sm font-bold text-white tracking-wider uppercase hover:opacity-90 transition-opacity">
            Goal<span className="text-brand-400">Flow</span>
          </Link>
          <p className="text-[11px] text-surface-500 mt-1.5">
            &copy; 2026 GoalFlow. All rights reserved.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-surface-400">
          <Link href="/about" className="hover:text-white transition-colors">
            About
          </Link>
          <Link href="/contact" className="hover:text-white transition-colors">
            Contact
          </Link>
          <Link href="/privacy-policy" className="hover:text-white transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms-and-conditions" className="hover:text-white transition-colors">
            Terms & Conditions
          </Link>
        </div>
      </div>
    </footer>
  )
}
