'use client'

import { useEffect } from "react"
import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { usePathname } from 'next/navigation'
import { analyticsPath, sanitizeAnalyticsEvent } from '@/lib/analytics-privacy'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    if (!key) return
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com',
      person_profiles: 'never',
      defaults: '2025-11-30',
      cookieless_mode: 'always',
      persistence: 'memory',
      disable_persistence: true,
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      disable_session_recording: true,
      disable_surveys: true,
      advanced_disable_flags: true,
      capture_heatmaps: false,
      capture_exceptions: false,
      rageclick: false,
      ip: false,
      before_send: sanitizeAnalyticsEvent,
    })
  }, [])

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return
    posthog.capture('$pageview', { $current_url: `https://estimador.pt${analyticsPath(pathname ?? '/')}` })
  }, [pathname])

  return (
    <PHProvider client={posthog}>
      {children}
    </PHProvider>
  )
}
