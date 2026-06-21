'use client'

import { useEffect, useRef } from 'react'
import { getAdConfig } from '@/lib/adService'

export default function BannerAd() {
  const containerRef = useRef<HTMLDivElement>(null)
  const config = getAdConfig()
  const banner320 = config.banner320
  const banner728 = config.banner728

  useEffect(() => {
    if (!banner320 && !banner728) return
    const container = containerRef.current
    if (!container) return

    // Clear previous script injections
    container.innerHTML = ''

    const isDesktop = window.innerWidth >= 768
    const key = (isDesktop && banner728) ? banner728 : (banner320 || banner728)
    const height = (isDesktop && banner728) ? 90 : 50
    const width = (isDesktop && banner728) ? 728 : 320

    if (!key) return

    // Setup script options and loading script
    const optionsScript = document.createElement('script')
    optionsScript.type = 'text/javascript'
    optionsScript.text = `
      atOptions = {
        'key' : '${key}',
        'format' : 'iframe',
        'height' : ${height},
        'width' : ${width},
        'params' : {}
      };
    `

    const invokeScript = document.createElement('script')
    invokeScript.type = 'text/javascript'
    invokeScript.src = `//www.highperformanceformat.com/${key}/invoke.js`
    container.appendChild(optionsScript)
    container.appendChild(invokeScript)
  }, [banner320, banner728])

  if (!banner320 && !banner728) return null

  return (
    <div className="flex flex-col items-center justify-center my-4 w-full">
      <span className="text-[9px] uppercase tracking-wider text-surface-500 mb-1.5">Sponsored</span>
      <div
        ref={containerRef}
        className="flex items-center justify-center overflow-hidden bg-white/5 rounded-xl border border-white/5 max-w-full"
        style={{ minHeight: '50px' }}
      />
    </div>
  )
}
