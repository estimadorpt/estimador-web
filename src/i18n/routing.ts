import {createLocalizedPathnamesNavigation} from 'next-intl/navigation';
 
export const locales = ['en', 'pt'] as const;
export const defaultLocale = 'pt' as const;

// Define the pathnames for each locale
export const pathnames = {
  '/': '/',
  '/forecast': '/forecast',
  '/about': '/about', 
  '/articles': '/articles',
  '/methodology': '/methodology'
} as const;

export const {Link, redirect, usePathname, useRouter} =
  createLocalizedPathnamesNavigation({
    locales,
    pathnames,
    defaultLocale
  });