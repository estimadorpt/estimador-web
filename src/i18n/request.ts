import {getRequestConfig} from 'next-intl/server';
import {locales, defaultLocale} from './routing';
 
export default getRequestConfig(async ({locale}) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.some(candidate => candidate === locale)) {
    locale = defaultLocale;
  }
 
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
