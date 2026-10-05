'use client';

import { useEffect, useSyncExternalStore, type ReactNode } from 'react';
import { useLocale } from 'next-intl';

const noSubscription = () => () => {};
const pathIsEnglish = () => /^\/en(\/|$)/.test(window.location.pathname);

/**
 * The root 404 is one file, /404.html, served for every unknown address under
 * both locales. It ships both languages and shows the one the address asks
 * for: Portuguese while prerendering (and without JavaScript), English after
 * hydration under /en/, with `lang` on <html> following.
 */
export function NotFoundByPath({ pt, en }: { pt: ReactNode; en: ReactNode }) {
  const english = useSyncExternalStore(noSubscription, pathIsEnglish, () => false);
  useEffect(() => {
    document.documentElement.lang = english ? 'en' : 'pt';
  }, [english]);
  return <>{english ? en : pt}</>;
}

/** Inside a locale the provider already knows the language. */
export function NotFoundByLocale({ pt, en }: { pt: ReactNode; en: ReactNode }) {
  return <>{useLocale() === 'en' ? en : pt}</>;
}
