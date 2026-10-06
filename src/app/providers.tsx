'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import type { PostHog, PostHogConfig } from 'posthog-js'
import { analyticsPath, sanitizeAnalyticsEvent } from '@/lib/analytics-privacy'

/**
 * The analytics client's settings. Unchanged by the lazy loading below: no
 * persistence, no cookies, no person profiles, no autocapture, replay,
 * surveys, flags, heatmaps or exception capture, no IP, and every event passes
 * through sanitizeAnalyticsEvent before it leaves the page (the privacy page,
 * src/content/privacy/*.mdx, describes exactly this).
 */
export const POSTHOG_OPTIONS = {
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
} satisfies Partial<PostHogConfig>

/** After the page has painted and gone idle, or after 4 s at the latest. */
function whenIdle(): Promise<void> {
  return new Promise(resolve => {
    if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(() => resolve(), { timeout: 4000 })
    else setTimeout(resolve, 1500)
  })
}

let client: Promise<PostHog | null> | null = null

/**
 * posthog-js (about 53 KB gzipped) is no longer in the shared bundle: it is
 * fetched once the browser is idle, so it never competes with the page's own
 * fonts, data and hero image. One promise for the whole visit; page views
 * that happen before it resolves wait on it and are sent in order.
 */
function loadPostHog(key: string): Promise<PostHog | null> {
  client ??= whenIdle()
    .then(() => import('posthog-js'))
    .then(({ default: posthog }) => {
      posthog.init(key, {
        ...POSTHOG_OPTIONS,
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com',
      })
      return posthog
    })
    // Blocked by an extension or offline: the page carries on without analytics.
    .catch(() => null)
  return client
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    if (!key) return
    // The address is read now, for this page, even if the library arrives later.
    const url = `https://estimador.pt${analyticsPath(pathname ?? '/')}`
    void loadPostHog(key).then(posthog => posthog?.capture('$pageview', { $current_url: url }))
  }, [pathname])

  return <>{children}</>
}
