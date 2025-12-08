import posthog from 'posthog-js';

export const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || '';
export const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com';

export function initPostHog() {
  if (typeof window !== 'undefined' && POSTHOG_KEY) {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      person_profiles: 'identified_only',
      capture_pageview: false, // We capture pageviews manually for better SPA control
      capture_pageleave: true,
      persistence: 'localStorage+cookie',
      
      // Autocapture clicks, inputs, form submissions, etc.
      autocapture: true,
      
      // Enable heatmaps (clicks, mouse movements, scrolling)
      enable_heatmaps: true,
      
      // Enable web vitals (LCP, FID, CLS, etc.)
      capture_performance: {
        web_vitals: true,
        network_timing: true,
      },
      
      // Session replay
      disable_session_recording: false,
      session_recording: {
        maskAllInputs: false, // Set to true if you have sensitive inputs
        maskTextSelector: '[data-mask]', // Mask elements with data-mask attribute
      },
      
      // Capture clicks that don't trigger any action (dead clicks) - useful for UX
      capture_dead_clicks: true,
      
      // Scroll depth tracking
      scroll_root_selector: ['body'],
      
      loaded: (posthog) => {
        if (process.env.NODE_ENV === 'development') {
          // Optionally disable session recording in development
          // posthog.stopSessionRecording();
        }
      },
    });
  }
  return posthog;
}

export { posthog };

