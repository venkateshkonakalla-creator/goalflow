'use client'

import { useEffect, useState, useRef } from 'react'
import { Play, Sparkles, X, Zap } from 'lucide-react'
import { getAdConfig } from '@/lib/adService'

interface RewardedAdModalProps {
  feature: string
  onComplete: () => void
  onClose: () => void
}

const FEATURE_LABELS: Record<string, string> = {
  goal_creation: 'Goal Creation',
  affordability_checker: 'Affordability Checker',
  savings_plan: 'Savings Plan Generator',
}

const FINANCE_TIPS = [
  'GoalFlow Premium: Track unlimited goals with custom color palettes!',
  'Did you know? Allocating your salary first helps reduce impulse spending by 23%.',
  'Keep your budget healthy! Set up an emergency fund covering 3-6 months of expenses.',
  'Analyze your goal impact instantly before making any major purchase.',
]

export default function RewardedAdModal({ feature, onComplete, onClose }: RewardedAdModalProps) {
  const [countdown, setCountdown] = useState(5)
  const [tipIndex, setTipIndex] = useState(0)
  const hasTriggered = useRef(false)

  useEffect(() => {
    setTipIndex(Math.floor(Math.random() * FINANCE_TIPS.length))

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          if (!hasTriggered.current) {
            hasTriggered.current = true
            // Open smartlink in a new tab
            const config = getAdConfig()
            const smartlink = config.smartlink || 'https://www.google.com'
            if (typeof window !== 'undefined') {
              window.open(smartlink, '_blank', 'noopener,noreferrer')
            }
            onComplete()
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [onComplete])

  const progressPct = ((5 - countdown) / 5) * 100
  const featureLabel = FEATURE_LABELS[feature] || 'Premium Feature'

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md glass rounded-3xl p-6 sm:p-8 shadow-glow border border-brand-500/20 overflow-hidden flex flex-col items-center text-center">
        {/* Glow decoration */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-success-500/10 rounded-full blur-3xl" />

        {/* Modal Header */}
        <div className="w-full flex items-center justify-between mb-6 z-10">
          <span className="text-[10px] uppercase font-bold tracking-wider text-surface-500 bg-white/5 border border-white/8 px-2.5 py-1 rounded-full">
            Sponsored Content
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-surface-400 hover:text-danger-400 hover:bg-danger-500/8 transition-colors"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Interactive Ad Body */}
        <div className="flex-1 flex flex-col items-center justify-center py-4 z-10 w-full">
          {/* Animated Spinner/Counter */}
          <div className="relative w-28 h-28 flex items-center justify-center mb-6">
            <svg className="absolute inset-0 w-full h-full transform -rotate-90">
              <circle
                cx="56"
                cy="56"
                r="50"
                className="stroke-white/5"
                strokeWidth="6"
                fill="transparent"
              />
              <circle
                cx="56"
                cy="56"
                r="50"
                className="stroke-brand-500 transition-all duration-1000 ease-linear"
                strokeWidth="6"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 50}
                strokeDashoffset={2 * Math.PI * 50 * (1 - progressPct / 100)}
                strokeLinecap="round"
              />
            </svg>
            <div className="flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-white">{countdown}</span>
              <span className="text-[9px] uppercase tracking-widest text-brand-300 font-semibold mt-0.5">seconds</span>
            </div>
          </div>

          <h3 className="text-lg font-bold text-surface-50 flex items-center gap-1.5 mb-2">
            Unlocking <span className="text-brand-400">{featureLabel}</span>
          </h3>
          <p className="text-xs text-surface-400 max-w-xs leading-relaxed mb-6">
            Please wait {countdown > 0 ? `${countdown} seconds` : 'a moment'} while we fetch your sponsored unlock.
          </p>

          {/* Ad Mock Card */}
          <div className="w-full bg-white/3 border border-white/5 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 text-left mb-2 relative group overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 flex-shrink-0">
              <Zap size={20} className="animate-pulse" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-surface-200 uppercase tracking-wide">GoalFlow Premium Tip</p>
              <p className="text-xs text-surface-300 mt-1 leading-relaxed">{FINANCE_TIPS[tipIndex]}</p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-[10px] text-surface-600 mt-4 z-10">
          Sponsors help keep GoalFlow free for everyone. Thank you!
        </p>
      </div>
    </div>
  )
}
