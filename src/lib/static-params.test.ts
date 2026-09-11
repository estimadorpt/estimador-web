import { describe, expect, it } from 'vitest';
import { paramsOrPlaceholder } from './static-params';
import { SITE_LOCALES } from './metadata';

describe('static param fallback', () => {
  it('passes real params through untouched', () => {
    const real = [{ locale: 'pt', slug: 'uma-nota' }, { locale: 'en', slug: 'a-note' }];
    expect(paramsOrPlaceholder(real, 'slug', 'sem-artigos')).toBe(real);
  });

  // The whole point: an archive with nothing in it must still export. Next
  // reads an empty param list as a missing generateStaticParams and fails the
  // build, so this is what stands between "published nothing" and "shipped
  // nothing".
  it('covers every locale when there is nothing to enumerate', () => {
    const params = paramsOrPlaceholder([] as { locale: string; slug: string }[], 'slug', 'sem-artigos');
    expect(params).toHaveLength(SITE_LOCALES.length);
    expect(params.map(p => p.locale).sort()).toEqual([...SITE_LOCALES].sort());
    expect(params.every(p => p.slug === 'sem-artigos')).toBe(true);
  });

  it('names the placeholder under whichever key the route uses', () => {
    const params = paramsOrPlaceholder([] as { locale: string; tag: string }[], 'tag', 'sem-temas');
    expect(params[0]).toEqual({ locale: SITE_LOCALES[0], tag: 'sem-temas' });
  });
});
