/**
 * The site's words about itself, written once.
 *
 * CLAUDE.md ("Communications") promises one line, one descriptor and the bios,
 * used identically everywhere they appear. They live in descriptor.json so the
 * Node generators (scripts/generate-og-images.mjs, scripts/generate-social-kit.mjs)
 * can read the same file the app imports, the way they already read
 * geometry.json. descriptor.test.ts holds every surface that prints them to
 * these strings; a new surface imports from here rather than retyping them.
 */
import copy from './descriptor.json';

export type BrandLocale = 'pt' | 'en';

function pick(entry: Record<BrandLocale, string>, locale: string): string {
  return locale === 'en' ? entry.en : entry.pt;
}

/** "Dados para compreender Portugal." */
export const BRAND_LINE: Readonly<Record<BrandLocale, string>> = copy.line;
/** "Dados e modelos sobre Portugal, com a incerteza à vista: …": what is live, in that order. */
export const BRAND_DESCRIPTOR: Readonly<Record<BrandLocale, string>> = copy.descriptor;
/** The social bio (under 160 characters), live sections first. */
export const BRAND_BIO: Readonly<Record<BrandLocale, string>> = copy.bio;

export const brandLine = (locale: string) => pick(copy.line, locale);
export const brandDescriptor = (locale: string) => pick(copy.descriptor, locale);
export const brandBio = (locale: string) => pick(copy.bio, locale);
