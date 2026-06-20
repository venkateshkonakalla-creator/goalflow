'use client'
// src/context/ToastContext.tsx
// ─── TOAST NOTIFICATION SYSTEM ─────────────────────────────────────────────────
// Lightweight, dependency-free toast notifications used across the app for
// success/error/info feedback after CRUD actions.

import { createContext, useContext, useCallback, useState, ReactNode } from 'react'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'

export type ToastVariant = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  variant: ToastVariant
}

interface ToastContextType {
  showToast: (message: string, variant?: ToastVariant) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

const VARIANT_STYLES: Record<ToastVariant, { icon: typeof CheckCircle2; className: string; iconClassName: string }> = {
  success: { icon: CheckCircle2, className: 'border-success-500/20 bg-success-500/10', iconClassName: 'text-success-400' },
  error:   { icon: XCircle,      className: 'border-danger-500/20 bg-danger-500/10',   iconClassName: 'text-danger-400' },
  info:    { icon: Info,         className: 'border-brand-500/20 bg-brand-500/10',     iconClassName: 'text-brand-400' },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, variant: ToastVariant = 'success') => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, message, variant }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3500)
  }, [])

  const dismiss = (id: string) => setToasts(prev => prev.filter(t => t.id !== id))

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast stack — fixed bottom on mobile, bottom-right on desktop */}
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-[200] flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => {
          const style = VARIANT_STYLES[toast.variant]
          const Icon = style.icon
          return (
            <div
              key={toast.id}
              role="status"
              className={`pointer-events-auto glass border rounded-xl px-4 py-3 flex items-start gap-3 shadow-card animate-slide-up ${style.className}`}
            >
              <Icon size={16} className={`${style.iconClassName} flex-shrink-0 mt-0.5`} />
              <p className="text-sm text-surface-200 flex-1 leading-snug">{toast.message}</p>
              <button
                onClick={() => dismiss(toast.id)}
                className="text-surface-500 hover:text-surface-300 flex-shrink-0"
                aria-label="Dismiss notification"
              >
                <X size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
