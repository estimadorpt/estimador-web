import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createPageMetadata, resolveOgImageFile, SITE_LOCALES, type OgManifest } from './metadata';
import { getMDXArticlesByLocale } from './mdx-articles';

const manifest: OgManifest = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'public/og-manifest.json'), 'utf8'),
);

function socialImage(metadata: ReturnType<typeof createPageMetadata>): string {
  const images = metadata.openGraph?.images;
  const first = Array.isArray(images) ? images[0] : images;
  return String((first as { url: string }).url);
}

describe('og card resolution', () => {
  const stub: OgManifest = {
    files: { pt: 'og-image-pt-aaaa1111.png' },
    cards: { pt: { '/economia': 'og-image-economia-pt-bbbb2222.png' } },
  };

  it('prefers the card a page has over the locale default', () => {
    expect(resolveOgImageFile(stub, 'pt', '/economia')).toBe('og-image-economia-pt-bbbb2222.png');
  });

  it('falls back to the locale default for a page with no card of its own', () => {
    expect(resolveOgImageFile(stub, 'pt', '/sobre')).toBe('og-image-pt-aaaa1111.png');
  });

  // A build that ships without a generated manifest still has to emit a valid
  // og:image, which is what the unversioned files in public/ are for.
  it('falls back to the unversioned file when there is no manifest at all', () => {
    expect(resolveOgImageFile(null, 'en', '/economia')).toBe('og-image-en.png');
  });

  it('reads a route the same with or without surrounding slashes', () => {
    for (const variant of ['/economia', 'economia', '/economia/']) {
      expect(resolveOgImageFile(stub, 'pt', variant)).toBe('og-image-economia-pt-bbbb2222.png');
    }
  });

  it('treats the site root as its own route key', () => {
    expect(resolveOgImageFile({ cards: { pt: { '/': 'og-image-home.png' } } }, 'pt', '/')).toBe('og-image-home.png');
  });
});

describe('generated cards', () => {
  it('gives every published article a card in the locale it was written in', () => {
    for (const locale of SITE_LOCALES) {
      for (const article of getMDXArticlesByLocale(locale)) {
        expect(manifest.cards?.[locale]?.[`/artigos/${article.slug}`], `${locale}/${article.slug}`)
          .toMatch(/^og-image-artigo-.+\.png$/);
      }
    }
  });

  it('ships every file the manifest names', () => {
    const named = [
      ...Object.values(manifest.files ?? {}),
      ...Object.values(manifest.cards ?? {}).flatMap(cards => Object.values(cards)),
      ...SITE_LOCALES.map(locale => `og-image-${locale}.png`),
    ];
    for (const file of new Set(named)) {
      expect(fs.existsSync(path.join(process.cwd(), 'public', file)), file).toBe(true);
    }
  });

  // The immutable cache header in staticwebapp.config.json is keyed on this
  // prefix, so a card named anything else would be served with no cache at all.
  it('names every card so the cache-forever rule matches it', () => {
    for (const cards of Object.values(manifest.cards ?? {})) {
      for (const file of Object.values(cards)) {
        expect(file).toMatch(/^og-image-.+-[0-9a-f]{8}\.png$/);
      }
    }
  });
});

describe('page metadata', () => {
  // Resolution itself is covered above against a stub manifest. What this adds
  // is that createPageMetadata reads the real generated one, so it uses a route
  // the generator always emits rather than an article — the archive can be
  // empty, and this assertion should not depend on editorial state.
  it('points a page at the card generated for it', () => {
    const route = '/economia';
    const card = manifest.cards?.pt?.[route];
    expect(card, 'the generator always emits an /economia card').toBeTruthy();
    const metadata = createPageMetadata({ locale: 'pt', path: route, title: 'x', description: 'y' });
    expect(socialImage(metadata)).toBe(`https://estimador.pt/${card}`);
  });

  it('gives a page without a card the locale default', () => {
    expect(socialImage(createPageMetadata({ locale: 'pt', path: '/sobre', title: 'x', description: 'y' })))
      .toBe(`https://estimador.pt/${manifest.files!.pt}`);
  });
});
