import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createPageMetadata, getOgImageSize, metaLengthIssues, resolveOgImageFile, SITE_LOCALES, type OgManifest } from './metadata';
import { getMDXArticlesByLocale } from './mdx-articles';
import { ECONOMY_PUBLISHED } from './config/economy-status';

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

  // SP-M1: a match, club, game or region page shares its section's card, not
  // the four-section brochure.
  it('gives a page under a section the section card (longest prefix, whole segments)', () => {
    const sections: OgManifest = {
      files: { pt: 'og-image-pt-aaaa1111.png' },
      cards: { pt: {
        '/': 'og-image-pt-aaaa1111.png',
        '/desporto/liga': 'og-image-liga-pt-cccc3333.png',
        '/populacao': 'og-image-populacao-pt-dddd4444.png',
        '/artigos/uma-nota': 'og-image-artigo-uma-nota-pt-eeee5555.png',
      } },
    };
    for (const route of ['/desporto/liga/jogo/benfica-vitoria', '/desporto/liga/porto', '/desporto/liga/simulador/', 'desporto/liga/jogo-previsoes']) {
      expect(resolveOgImageFile(sections, 'pt', route), route).toBe('og-image-liga-pt-cccc3333.png');
    }
    for (const route of ['/populacao/misteriosa', '/populacao/regiao/lisboa', '/populacao/freguesia/_', '/populacao/dados']) {
      expect(resolveOgImageFile(sections, 'pt', route), route).toBe('og-image-populacao-pt-dddd4444.png');
    }
    // Not a prefix by segment, an archived season, the imagined miniature, the root.
    for (const route of ['/desporto/liga2', '/desporto/liga/2025-26', '/populacao/miniatura', '/sobre', '/artigos/outra']) {
      expect(resolveOgImageFile(sections, 'pt', route), route).toBe('og-image-pt-aaaa1111.png');
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

  // SP-20: og:image:width/height must be the file's own size.
  it('records the size the cards really are, and pages declare it', () => {
    expect(manifest.size, 'npm run og writes size').toBeDefined();
    const pngSize = (file: string) => {
      const png = fs.readFileSync(path.join(process.cwd(), 'public', file));
      return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
    };
    for (const cards of Object.values(manifest.cards ?? {})) {
      for (const file of Object.values(cards)) expect(pngSize(file), file).toEqual(manifest.size);
    }
    expect(getOgImageSize()).toEqual(manifest.size);
    const images = createPageMetadata({ locale: 'pt', path: '/sobre', title: 'x', description: 'y' }).openGraph?.images;
    const first = (Array.isArray(images) ? images[0] : images) as { width: number; height: number };
    expect({ width: first.width, height: first.height }).toEqual(manifest.size);
  });

  // FR-M1: production's cards keep answering after a deploy.
  it('ships every card the previous deploy served', () => {
    for (const file of (manifest as OgManifest & { retained?: string[] }).retained ?? []) {
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
  // empty, and this assertion should not depend on editorial state. The Liga
  // card is emitted whenever a matchday file exists, which the site requires.
  it('points a page at the card generated for it', () => {
    const route = '/desporto/liga';
    const card = manifest.cards?.pt?.[route];
    expect(card, 'the generator always emits a /desporto/liga card').toBeTruthy();
    const metadata = createPageMetadata({ locale: 'pt', path: route, title: 'x', description: 'y' });
    expect(socialImage(metadata)).toBe(`https://estimador.pt/${card}`);
  });

  // While the economy is in preparation its page shares the brand card: a
  // number on the share card that the page does not show is the bug this
  // flag exists to prevent.
  it('emits no economy card while the section is unpublished', () => {
    if (ECONOMY_PUBLISHED) return;
    for (const locale of SITE_LOCALES) {
      expect(manifest.cards?.[locale]?.['/economia'], locale).toBeUndefined();
      expect(socialImage(createPageMetadata({ locale, path: '/economia', title: 'x', description: 'y' })))
        .toBe(`https://estimador.pt/${manifest.files![locale]}`);
    }
  });

  it('gives a page without a card the locale default', () => {
    expect(socialImage(createPageMetadata({ locale: 'pt', path: '/sobre', title: 'x', description: 'y' })))
      .toBe(`https://estimador.pt/${manifest.files!.pt}`);
  });
});

describe('title and description length', () => {
  it('flags what search results truncate', () => {
    expect(metaLengthIssues('Quem vive em cada freguesia? | estimador.pt', 'Curta.')).toEqual([]);
    const issues = metaLengthIssues('x'.repeat(71), 'y'.repeat(161));
    expect(issues).toHaveLength(2);
    expect(issues[0]).toContain('71');
    expect(issues[1]).toContain('161');
  });
});
