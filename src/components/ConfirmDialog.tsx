'use client'
// src/components/ConfirmDialog.tsx
// ─── CONFIRMATION DIALOG ────────────────────────────────────────────────────────
// Reusable confirm/cancel dialog for destructive actions (delete goal, delete
// expense, etc). Mobile-friendly: full width on small screens, centered modal
// on larger screens.

import { AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-sm glass rounded-2xl p-6 animate-slide-up">
        <div className="flex items-start gap-3 mb-4">
          {variant === 'danger' && (
            <div className="w-10 h-10 rounded-xl bg-danger-500/15 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={18} className="text-danger-400" />
            </div>
          )}
          <div>
            <h2 className="text-base font-semibold text-surface-50">{title}</h2>
            {description && (
              <p className="text-sm text-surface-400 mt-1 leading-relaxed">{description}</p>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 bg-white/5 hover:bg-white/8 border border-white/10 text-surface-300 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 ${
              variant === 'danger'
                ? 'bg-danger-500 hover:bg-danger-600 text-white'
                : 'bg-brand-500 hover:bg-brand-600 text-white'
            }`}
          >
            {loading ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
