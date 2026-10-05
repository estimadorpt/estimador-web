import {getRequestConfig} from 'next-intl/server';
import {locales, defaultLocale} from './routing';

/**
 * The locale for a server render.
 *
 * An explicit `locale` (getTranslations({ locale }) and friends) wins. Without
 * one, `requestLocale` carries whatever `setRequestLocale` set for this render:
 * the static export has no middleware, so that call — made in the [locale]
 * layout and in the pages — is the only way an implicit getTranslations() or
 * getLocale() learns that it is rendering /en/. Anything else falls back to pt.
 */
export default getRequestConfig(async ({locale, requestLocale}) => {
  let resolved = locale ?? (await requestLocale);
  if (!locales.some(candidate => candidate === resolved)) {
    resolved = defaultLocale;
  }

  return {
    locale: resolved as string,
    messages: (await import(`../../messages/${resolved}.json`)).default
  };
});
