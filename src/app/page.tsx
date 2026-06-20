'use client'
// src/app/page.tsx — Landing Page
import Link from 'next/link'
import Footer from '@/components/Footer'
import {
  ArrowRight, TrendingUp, Target, Zap, Shield, BarChart3,
  Star, Sparkles
} from 'lucide-react'

const FEATURES = [
  {
    icon: Target,
    title: 'Goal-First Planning',
    desc: 'Set financial goals, then automatically allocate your salary to hit them faster.',
    color: 'text-brand-400',
    bg: 'bg-brand-500/10',
  },
  {
    icon: Zap,
    title: 'Goal Impact Engine',
    desc: 'Every purchase tells you how many days it delays your dream goal. Real accountability.',
    color: 'text-warning-400',
    bg: 'bg-warning-500/10',
  },
  {
    icon: BarChart3,
    title: 'Smart Analytics',
    desc: 'Visual spending trends, savings rates, and goal progress — all in one dashboard.',
    color: 'text-success-400',
    bg: 'bg-success-500/10',
  },
  {
    icon: Shield,
    title: 'Monthly Planning',
    desc: 'Allocate your salary before the month starts. Live within your plan, not after the fact.',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
  },
]

const STEPS = [
  { n: '01', title: 'Set your income', desc: 'Enter your monthly salary once.' },
  { n: '02', title: 'Create your goals', desc: 'Emergency fund, laptop, bike — anything you\'re saving for.' },
  { n: '03', title: 'Allocate & track', desc: 'Split your salary across goals and log expenses as you go.' },
  { n: '04', title: 'See your impact', desc: 'Every spend shows exactly how it affects your goals.' },
]

const TESTIMONIALS = [
  {
    name: 'Early User',
    role: 'Beta Tester',
    text: 'We are currently collecting feedback from early users to improve GoalFlow and make goal-based financial planning simpler.',
    avatar: 'EU',
    stars: 5,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-950 text-surface-50 overflow-x-hidden">
      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-surface-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
              <TrendingUp size={16} className="text-white" />
            </div>
            <span className="font-semibold text-lg tracking-tight">GoalFlow</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-surface-400">
            <a href="#features" className="hover:text-surface-50 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-surface-50 transition-colors">How it works</a>
            <a href="#testimonials" className="hover:text-surface-50 transition-colors">Reviews</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm text-surface-400 hover:text-surface-50 transition-colors">
              Sign in
            </Link>
            <Link
              href="/auth/signup"
              className="text-sm bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg transition-colors font-medium"
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-32 pb-24 px-6 relative">
        {/* Mesh gradient background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-brand-600/20 rounded-full blur-[120px]" />
          <div className="absolute top-32 left-1/4 w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-[80px]" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 rounded-full px-4 py-1.5 text-sm text-brand-300 mb-8">
            <Sparkles size={14} />
            Built for India's young professionals
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.08] mb-6">
            Every expense has a cost.<br />
            GoalFlow shows the <span className="gradient-text">real one.</span>
          </h1>

          <p className="text-xl text-surface-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Track your salary, manage goals, and instantly see how every purchase delays or accelerates your financial future.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-8 py-4 rounded-xl text-base font-semibold transition-all hover:shadow-glow"
            >
              Start for free <ArrowRight size={18} />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/8 border border-white/10 text-surface-200 px-8 py-4 rounded-xl text-base font-semibold transition-colors"
            >
              See how it works
            </a>
          </div>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-6 mt-12 text-sm text-surface-500">
            <span>✓ Free forever</span>
            <span>✓ No credit card</span>
            <span>✓ Setup in 2 minutes</span>
          </div>
        </div>

        {/* ── App Preview Card ── */}
        <div className="max-w-4xl mx-auto mt-20 relative">
          <div className="absolute inset-0 bg-brand-500/10 rounded-3xl blur-3xl scale-95" />
          <div className="relative glass rounded-3xl p-6 md:p-8">
            {/* Mock dashboard preview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Monthly Income', val: '₹16,000', up: true },
                { label: 'Savings Rate', val: '62%', up: true },
                { label: 'Active Goals', val: '4', up: false },
                { label: 'Remaining', val: '₹7,450', up: true },
              ].map(stat => (
                <div key={stat.label} className="bg-white/4 rounded-2xl p-4">
                  <p className="text-xs text-surface-500 mb-1">{stat.label}</p>
                  <p className="text-xl font-bold text-surface-50">{stat.val}</p>
                </div>
              ))}
            </div>

            {/* Goal impact notification */}
            <div className="bg-warning-500/10 border border-warning-500/20 rounded-2xl p-4 flex items-start gap-3">
              <div className="w-8 h-8 bg-warning-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <Zap size={16} className="text-warning-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-warning-300">Goal Impact Alert</p>
                <p className="text-sm text-surface-400 mt-0.5">
                  You spent ₹1,200 on shopping.{' '}
                  <span className="text-surface-200">Your Laptop Fund goal is now delayed by 5 days.</span>
                </p>
              </div>
            </div>

            {/* Progress bars */}
            <div className="mt-6 space-y-3">
              {[
                { name: 'Emergency Fund', pct: 37, color: 'bg-warning-400', saved: '₹18,500', target: '₹50,000' },
                { name: 'Laptop Fund', pct: 37, color: 'bg-brand-400', saved: '₹22,000', target: '₹60,000' },
                { name: 'Self-improvement', pct: 55, color: 'bg-success-400', saved: '₹5,500', target: '₹10,000' },
              ].map(g => (
                <div key={g.name} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs text-surface-400 mb-1.5">
                      <span>{g.name}</span>
                      <span>{g.saved} / {g.target}</span>
                    </div>
                    <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                      <div className={`h-full ${g.color} rounded-full progress-bar`} style={{ width: `${g.pct}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-brand-400 text-sm font-medium mb-3 tracking-wider uppercase">Features</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Not just tracking. <span className="gradient-text">Guiding.</span>
            </h2>
            <p className="text-surface-400 text-lg max-w-2xl mx-auto">
              Traditional apps tell you where money went. GoalFlow tells you where it should go.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className="glass rounded-2xl p-6 hover:bg-white/6 transition-colors group">
                <div className={`w-10 h-10 ${f.bg} rounded-xl flex items-center justify-center mb-4`}>
                  <f.icon size={20} className={f.color} />
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-surface-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparison ── */}
      <section className="py-24 px-6 relative border-t border-white/5 bg-white/1">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-brand-400 text-sm font-medium mb-3 tracking-wider uppercase">Comparison</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Not another <span className="gradient-text">expense tracker.</span>
            </h2>
          </div>

          <div className="glass rounded-3xl overflow-hidden border border-white/5">
            <div className="grid grid-cols-2 border-b border-white/5 bg-white/2 text-sm font-semibold tracking-wide uppercase text-surface-400">
              <div className="p-4 md:p-6 text-center border-r border-white/5">Traditional Apps</div>
              <div className="p-4 md:p-6 text-center text-brand-400">GoalFlow</div>
            </div>
            <div className="divide-y divide-white/5 text-sm md:text-base">
              {[
                { label: 'Tracks expenses', goal: 'Tracks expenses + goal delays' },
                { label: 'Monthly reports', goal: 'Real-time impact alerts' },
                { label: 'Budget focused', goal: 'Goal focused' },
              ].map((row, idx) => (
                <div key={idx} className="grid grid-cols-2 hover:bg-white/2 transition-colors">
                  <div className="p-4 md:p-6 text-center text-surface-400 border-r border-white/5">{row.label}</div>
                  <div className="p-4 md:p-6 text-center text-surface-50 font-medium">{row.goal}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-24 px-6 bg-white/2">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-brand-400 text-sm font-medium mb-3 tracking-wider uppercase">How it works</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Up and running in <span className="gradient-text">minutes.</span>
            </h2>
          </div>

          <div className="space-y-4">
            {STEPS.map((step, i) => (
              <div key={step.n} className="flex gap-6 items-start glass rounded-2xl p-6">
                <span className="text-3xl font-bold text-brand-500/40 font-mono flex-shrink-0 w-12">{step.n}</span>
                <div>
                  <h3 className="text-lg font-semibold mb-1">{step.title}</h3>
                  <p className="text-surface-400 text-sm">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-brand-400 text-sm font-medium mb-3 tracking-wider uppercase">Reviews</p>
            <h2 className="text-4xl font-bold tracking-tight">
              Loved by <span className="gradient-text">real people.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="hidden md:block" />
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="glass rounded-2xl p-6">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} size={14} className="text-warning-400 fill-warning-400" />
                  ))}
                </div>
                <p className="text-surface-300 text-sm leading-relaxed mb-6">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-brand-500/20 flex items-center justify-center text-xs font-bold text-brand-300">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-xs text-surface-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
            <div className="hidden md:block" />
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="glass rounded-3xl p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-brand-500/5 pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-brand-500/10 rounded-full blur-[60px] pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
                Your goals won't wait.<br />
                <span className="gradient-text">Start now.</span>
              </h2>
              <p className="text-surface-400 mb-8">Free forever. No credit card needed.</p>
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-8 py-4 rounded-xl text-base font-semibold transition-all hover:shadow-glow"
              >
                Create your free account <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Founder ── */}
      <section className="py-20 px-6 border-t border-white/5 bg-white/1">
        <div className="max-w-3xl mx-auto">
          <div className="glass rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-brand-500/5 pointer-events-none" />
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-brand-600 to-purple-600 flex items-center justify-center text-3xl font-extrabold text-white shadow-lg flex-shrink-0">
              VK
            </div>
            <div className="flex-1 text-center md:text-left relative z-10">
              <p className="text-brand-400 text-sm font-medium mb-1 tracking-wider uppercase">Founder</p>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-surface-50">
                Built by Venkatesh Konakalla
              </h2>
              <p className="text-surface-300 text-base md:text-lg leading-relaxed font-normal">
                GoalFlow started as a personal project to help students, freshers, and young professionals understand how daily spending affects long-term goals. Built using Next.js, Firebase, and real-world financial planning principles.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <Footer />
    </div>
  )
}
