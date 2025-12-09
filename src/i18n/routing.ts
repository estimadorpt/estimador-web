import {createNavigation} from 'next-intl/navigation';
import type {ComponentProps} from 'react';

export const locales = ['en', 'pt'] as const;
export const defaultLocale = 'pt' as const;

const {Link: NextIntlLink, redirect, usePathname, useRouter} =
  createNavigation({
    locales,
    defaultLocale
  });

/**
 * Custom Link component that disables prefetching by default.
 * 
 * This is necessary for static exports (output: 'export') because Next.js
 * tries to prefetch RSC payloads as .txt files, but these don't exist
 * in static exports, causing 404 console errors.
 */
function Link({prefetch = false, ...props}: ComponentProps<typeof NextIntlLink>) {
  return <NextIntlLink prefetch={prefetch} {...props} />;
}

export {Link, redirect, usePathname, useRouter};