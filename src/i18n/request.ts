import {getRequestConfig} from 'next-intl/server';
import {locales, defaultLocale} from './routing';
import {getPageLocale} from './request-locale';

/**
 * The locale for a server render.
 *
 * An explicit `locale` (getTranslations({ locale }) and friends) wins. Without
 * one, the locale the page recorded with setRequestLocale from
 * '@/i18n/request-locale' does: the static export has no middleware, and
 * next-intl's `requestLocale` would fall back to headers(), which a static
 * export cannot call, so it is never read here. Anything else falls back to pt.
 */
export default getRequestConfig(async ({locale}) => {
  let resolved = locale ?? getPageLocale();
  if (!locales.some(candidate => candidate === resolved)) {
    resolved = defaultLocale;
  }

  return {
    locale: resolved as string,
    messages: (await import(`../../messages/${resolved}.json`)).default
  };
});
