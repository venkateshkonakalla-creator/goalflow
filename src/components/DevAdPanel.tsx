'use client'

import { useState, useEffect } from 'react'
import { getAdConfig } from '@/lib/adService'
import { Code, CheckCircle, XCircle } from 'lucide-react'

export default function DevAdPanel() {
  const [isDev, setIsDev] = useState(false)
  const [collapsed, setCollapsed] = useState(true)

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      setIsDev(true)
    }
  }, [])

  if (!isDev) return null

  const config = getAdConfig()
  const status = [
    { name: 'Banner 320x50', value: config.banner320 },
    { name: 'Banner 728x90', value: config.banner728 },
    { name: 'Social Bar', value: config.socialBar },
    { name: 'Smartlink', value: config.smartlink },
  ]

  return (
    <div className="fixed bottom-4 left-4 z-[999] font-mono text-xs select-none">
      {collapsed ? (
        <button
          onClick={() => setCollapsed(false)}
          className="flex items-center gap-1.5 bg-surface-900/90 hover:bg-surface-800 text-surface-300 px-3 py-2 rounded-xl shadow-lg border border-white/10 transition-all"
        >
          <Code size={14} className="text-brand-400" />
          <span>Ads Dev Panel</span>
        </button>
      ) : (
        <div className="bg-surface-950/95 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-2xl w-64 flex flex-col gap-2.5 text-surface-300">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Code size={14} className="text-brand-400" /> Adsterra Config
            </span>
            <button
              onClick={() => setCollapsed(true)}
              className="text-surface-400 hover:text-white px-2 py-0.5 rounded hover:bg-white/5"
            >
              Hide
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {status.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-surface-400">{item.name}:</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 ${
                  item.value
                    ? 'bg-success-500/10 text-success-400 border border-success-500/20'
                    : 'bg-danger-500/10 text-danger-400 border border-danger-500/20'
                }`}>
                  {item.value ? <CheckCircle size={10} /> : <XCircle size={10} />}
                  {item.value ? 'Configured' : 'Missing'}
                </span>
              </div>
            ))}
          </div>

          <div className="text-[10px] text-surface-500 border-t border-white/5 pt-2 mt-1">
            Environment: <span className="text-brand-400">development</span>
          </div>
        </div>
      )}
    </div>
  )
}
