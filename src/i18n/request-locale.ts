import { cache } from 'react';
import { setRequestLocale as setNextIntlRequestLocale } from 'next-intl/server';

/**
 * The locale of the page being rendered, for the static export.
 *
 * next-intl's own fallback, `requestLocale`, reads a middleware header when
 * setRequestLocale was not called, and calling headers() fails a static
 * export outright. So request.ts never awaits it. Instead, a layout or page
 * that knows its locale calls this setRequestLocale (a drop-in for
 * next-intl's), which records the locale in a per-render store that
 * request.ts reads synchronously. Implicit getTranslations()/getLocale()
 * calls under that page then resolve to the right language; under a page that
 * has not called it, they fall back to pt exactly as before.
 *
 * Next renders layouts and pages separately, so the call belongs in every
 * page that relies on an implicit locale, not only in the [locale] layout.
 */
const store = cache((): { locale?: string } => ({}));

export function setRequestLocale(locale: string): void {
  setNextIntlRequestLocale(locale);
  store().locale = locale;
}

export function getPageLocale(): string | undefined {
  return store().locale;
}
