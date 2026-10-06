'use client';

import { useEffect, useSyncExternalStore, type ReactNode } from 'react';
import { useLocale } from 'next-intl';

const noSubscription = () => () => {};
const languageOfPath = (): 'pt' | 'en' => (/^\/en(\/|$)/.test(window.location.pathname) ? 'en' : 'pt');
const bothLanguages = () => 'both' as const;

/**
 * Hides the copy in the language the address does not ask for, from the first
 * paint: the root 404's head script (not-found.tsx) sets <html lang> from the
 * address and this rule reads it. It goes in the 404's own <style>, so it holds
 * before any stylesheet or script has loaded.
 */
export const NOT_FOUND_LANGUAGE_CSS = 'html[lang^="en"] [data-nf-lang="pt"],html:not([lang^="en"]) [data-nf-lang="en"]{display:none}';

/**
 * The root 404 is one file, /404.html, served for every unknown address under
 * both locales. Its static HTML holds both languages and NOT_FOUND_LANGUAGE_CSS
 * shows the one the address asks for, so an English reader never sees the
 * Portuguese page while the scripts load, or without them (SEO3V-M1). Once
 * hydrated, only that language stays in the document, with `lang` on <html>
 * following it.
 */
export function NotFoundByPath({ pt, en }: { pt: ReactNode; en: ReactNode }) {
  // 'both' while prerendering and hydrating, so the client matches the HTML.
  const language = useSyncExternalStore(noSubscription, languageOfPath, bothLanguages);
  useEffect(() => {
    if (language !== 'both') document.documentElement.lang = language === 'en' ? 'en-GB' : 'pt-PT';
  }, [language]);
  return (
    <>
      {language !== 'en' && <div key="pt" data-nf-lang="pt">{pt}</div>}
      {language !== 'pt' && <div key="en" data-nf-lang="en">{en}</div>}
    </>
  );
}

/** Inside a locale the provider already knows the language. */
export function NotFoundByLocale({ pt, en }: { pt: ReactNode; en: ReactNode }) {
  return <>{useLocale() === 'en' ? en : pt}</>;
}
