'use client';

import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';

/**
 * A locale for client components (next-intl's Link reads it) and nothing
 * else, for the root 404, which renders outside the locale layout.
 *
 * Client side on purpose: the server NextIntlClientProvider fills in formats,
 * time zone and "now" from the request config without a locale, and the root
 * not-found is rendered as a boundary of every page, so that call would fix
 * the request's implicit locale before the page could set it.
 */
export function LocaleOnlyProvider({ locale, children }: { locale: string; children: ReactNode }) {
  return (
    <NextIntlClientProvider locale={locale} messages={{}} timeZone="Europe/Lisbon">
      {children}
    </NextIntlClientProvider>
  );
}
