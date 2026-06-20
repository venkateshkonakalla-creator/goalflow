// src/app/layout.tsx
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import { ToastProvider } from '@/context/ToastContext'
import { AdProvider } from '@/context/AdContext'
import DevAdPanel from '@/components/DevAdPanel'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'GoalFlow — Smart Financial Goal Tracker & Budget Planner',
  description: 'Plan your income, track monthly expenses, run affordability checks, and achieve your financial goals with GoalFlow.',
  keywords: ['personal finance', 'budget planner', 'goal tracker', 'expense tracker', 'savings plan', 'financial health'],
  authors: [{ name: 'GoalFlow Team' }],
  creator: 'GoalFlow',
  publisher: 'GoalFlow',
  metadataBase: new URL('https://goalflow.example.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'GoalFlow — Smart Financial Goal Tracker & Budget Planner',
    description: 'Plan your income, track monthly expenses, run affordability checks, and achieve your financial goals with GoalFlow.',
    url: 'https://goalflow.example.com',
    siteName: 'GoalFlow',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GoalFlow — Smart Financial Goal Tracker & Budget Planner',
    description: 'Plan your income, track monthly expenses, run affordability checks, and achieve your financial goals with GoalFlow.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#09090b',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-surface-950 text-surface-50 antialiased overflow-x-hidden">
        <AuthProvider>
          <ToastProvider>
            <AdProvider>
              {children}
              <DevAdPanel />
            </AdProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

