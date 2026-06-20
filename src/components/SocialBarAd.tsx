'use client'

import { useEffect } from 'react'
import { getAdConfig } from '@/lib/adService'

export default function SocialBarAd() {
  const config = getAdConfig()
  const socialBar = config.socialBar

  useEffect(() => {
    if (!socialBar) return

    // Determine the source url: can be full URL starting with // or http, or a simple key
    const src = socialBar.startsWith('//') || socialBar.startsWith('http')
      ? socialBar
      : `//www.highperformanceformat.com/${socialBar}/invoke.js`

    const existing = document.querySelector(`script[src="${src}"]`)
    if (existing) return

    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = src
    script.async = true

    document.body.appendChild(script)

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [socialBar])

  return null
}
