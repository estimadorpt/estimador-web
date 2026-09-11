import { SITE_LOCALES } from '@/lib/metadata';

/**
 * Keeps a dynamic route buildable when it has nothing to enumerate.
 *
 * Under `output: 'export'` Next cannot tell a `generateStaticParams()` that
 * returned an empty array from one that was never defined, and reports both as
 * missing — so an archive with no articles fails the whole build rather than
 * exporting a site with no articles in it. Publishing nothing is a legal state,
 * and the site has to survive it: it is where a fresh clone starts, and where
 * this one is after clearing the drafts.
 *
 * The fallback emits one reserved param per locale. Both routes that use it
 * resolve an unknown value with `notFound()`, so the page it produces is a 404
 * — which is the honest answer for a slug that names nothing. Nothing links to
 * it, and the moment anything is published the real params take over.
 */
export function paramsOrPlaceholder<K extends string>(
  params: ({ locale: string } & Record<K, string>)[],
  key: K,
  placeholder: string,
): ({ locale: string } & Record<K, string>)[] {
  if (params.length) return params;
  return SITE_LOCALES.map(locale => ({ locale, [key]: placeholder }) as { locale: string } & Record<K, string>);
}
