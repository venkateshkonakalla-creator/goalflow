'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { saveContactMessage } from '@/lib/adService'
import { trackContactSubmitted } from '@/lib/analytics'
import { Mail, User, MessageSquare, Send, CheckCircle2 } from 'lucide-react'

export default function ContactForm() {
  const { user } = useAuth()
  const { showToast } = useToast()

  const [name, setName] = useState('')
  const [email, setEmail] = useState(user?.email || '')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      showToast('Please enter your name.', 'error')
      return
    }
    if (!email.trim()) {
      showToast('Please enter your email.', 'error')
      return
    }
    if (!message.trim()) {
      showToast('Please enter your message.', 'error')
      return
    }

    setSubmitting(true)
    try {
      await saveContactMessage(user?.uid || null, {
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
      })
      trackContactSubmitted()
      setSuccess(true)
      setName('')
      setMessage('')
      showToast('Message sent successfully! We will get back to you soon.', 'success')
    } catch (e) {
      showToast('Could not send message. Please try again.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="glass rounded-3xl p-8 border border-success-500/20 bg-success-500/5 text-center flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-12 h-12 bg-success-500/20 border border-success-500/30 rounded-2xl flex items-center justify-center text-success-400 mb-4">
          <CheckCircle2 size={24} />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Message Sent!</h2>
        <p className="text-sm text-surface-400 max-w-sm mb-6 leading-relaxed">
          Thank you for reaching out. We have received your message and our team will get back to you shortly.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="text-xs bg-white/5 hover:bg-white/8 border border-white/10 px-4 py-2.5 rounded-xl text-surface-300 transition-colors"
        >
          Send another message
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="glass rounded-3xl p-6 sm:p-8 border border-white/5 space-y-5">
      <div>
        <label className="block text-xs font-semibold text-surface-400 mb-1.5 uppercase tracking-wider">
          Name
        </label>
        <div className="relative">
          <User className="absolute left-4 top-3.5 text-surface-500" size={16} />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={submitting}
            placeholder="Your name"
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-surface-50 placeholder:text-surface-600 focus:border-brand-500/50"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-surface-400 mb-1.5 uppercase tracking-wider">
          Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-4 top-3.5 text-surface-500" size={16} />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
            placeholder="your.email@example.com"
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-surface-50 placeholder:text-surface-600 focus:border-brand-500/50"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-surface-400 mb-1.5 uppercase tracking-wider">
          Message
        </label>
        <div className="relative">
          <MessageSquare className="absolute left-4 top-3.5 text-surface-500" size={16} />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={submitting}
            placeholder="How can we help you?"
            rows={4}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-surface-50 placeholder:text-surface-600 focus:border-brand-500/50 resize-none"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl text-sm transition-colors min-h-[46px]"
      >
        {submitting ? (
          'Sending...'
        ) : (
          <>
            <Send size={14} /> Send Message
          </>
        )}
      </button>
    </form>
  )
}
