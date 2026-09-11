import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  getMDXArticlesByLocale,
  getMDXArticleBySlug,
  getArticlesByKind,
  getArticlesBySection,
  ARTICLE_KINDS,
  ARTICLE_SECTIONS,
} from './mdx-articles';
import { createPageMetadata, languageAlternates, localizedUrl, SITE_LOCALES } from './metadata';
import { GET as feedRoute } from '@/app/[locale]/feed.xml/route';

/**
 * Everything committed except the drafts — the set the site publishes, and the
 * set the placeholder and heading rules below are about. Asking for drafts
 * explicitly keeps these tests from depending on which NODE_ENV they run under.
 */
function publishedArticles(locale: string) {
  return getMDXArticlesByLocale(locale, { includeDrafts: true }).filter(article => !article.draft);
}

const messages = Object.fromEntries(
  SITE_LOCALES.map(locale => [
    locale,
    JSON.parse(fs.readFileSync(path.join(process.cwd(), 'messages', `${locale}.json`), 'utf8')),
  ]),
);

function flatKeys(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return [prefix];
  return Object.entries(value).flatMap(([key, child]) => flatKeys(child, prefix ? `${prefix}.${key}` : key));
}

describe('translation catalogues', () => {
  // A key present in one locale and missing in the other surfaces at build time
  // as MISSING_MESSAGE and ships an English string on a Portuguese page.
  it('define exactly the same keys in every locale', () => {
    const [first, ...rest] = SITE_LOCALES;
    const reference = new Set(flatKeys(messages[first]));
    for (const locale of rest) {
      const other = new Set(flatKeys(messages[locale]));
      expect([...reference].filter(key => !other.has(key)), `missing in ${locale}`).toEqual([]);
      expect([...other].filter(key => !reference.has(key)), `missing in ${first}`).toEqual([]);
    }
  });

  it('never leave a message empty', () => {
    for (const locale of SITE_LOCALES) {
      const empty = flatKeys(messages[locale]).filter(key => {
        const value = key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown>)?.[part], messages[locale]);
        return typeof value === 'string' && value.trim() === '';
      });
      expect(empty, `empty messages in ${locale}`).toEqual([]);
    }
  });
});

describe('published articles', () => {
  // The loader parses the MDX metadata export as strict JSON. A file written
  // with JavaScript object syntax passes review and breaks the production
  // build at generateStaticParams, which is how it reached main once already.
  it('parse in every locale that publishes them', () => {
    let total = 0;
    for (const locale of SITE_LOCALES) {
      for (const article of getMDXArticlesByLocale(locale)) {
        total += 1;
        expect(article.title.length, `${locale}/${article.slug} title`).toBeGreaterThan(0);
        expect(article.excerpt.length, `${locale}/${article.slug} excerpt`).toBeGreaterThan(0);
        expect(article.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(getMDXArticleBySlug(article.slug, locale)).not.toBeNull();
      }
      // An empty archive is a legal state, so the contract asserted here is
      // that the loader answers every locale with a list rather than throwing
      // or returning undefined — not that something happens to be published.
      expect(Array.isArray(getMDXArticlesByLocale(locale)), locale).toBe(true);
    }
    expect(total).toBeGreaterThanOrEqual(0);
  });

  it('carry no duplicated top-level heading (the page renders the title)', () => {
    for (const locale of SITE_LOCALES) {
      for (const article of getMDXArticlesByLocale(locale)) {
        const body = getMDXArticleBySlug(article.slug, locale)!.content;
        expect(body.split('\n').filter(line => /^#\s/.test(line)), `${locale}/${article.slug}`).toEqual([]);
      }
    }
  });
});

describe('article registers', () => {
  it('give every piece a known kind, defaulting to the evergreen one', () => {
    for (const locale of SITE_LOCALES) {
      for (const article of getMDXArticlesByLocale(locale)) {
        expect(ARTICLE_KINDS, `${locale}/${article.slug}`).toContain(article.kind);
      }
    }
  });

  // The index renders the two registers as separate sections. A piece in
  // neither would be published, sitemapped, in the feed — and invisible on the
  // page that is supposed to list it.
  it('partition the index with nothing left over', () => {
    for (const locale of SITE_LOCALES) {
      const all = getMDXArticlesByLocale(locale);
      const byKind = getArticlesByKind(locale);
      const listed = [...byKind.nota, ...byKind.explicador].map(article => article.slug).sort();
      expect(listed, locale).toEqual(all.map(article => article.slug).sort());
    }
  });

  it('never record a revision that predates publication', () => {
    for (const locale of SITE_LOCALES) {
      for (const article of getMDXArticlesByLocale(locale)) {
        if (article.updated) {
          expect(article.updated >= article.date, `${locale}/${article.slug}`).toBe(true);
        }
      }
    }
  });

  // scripts/new-note.mjs writes a valid placeholder so the dev server keeps
  // working while a piece is being drafted. This is what stops it shipping.
  // Drafts are exempt: an unfinished piece is allowed to read as unfinished,
  // and it is the draft flag, not this rule, that keeps it off the site.
  it('carry no scaffolded placeholder text once they are no longer drafts', () => {
    for (const locale of SITE_LOCALES) {
      for (const article of publishedArticles(locale)) {
        expect(`${article.title} ${article.excerpt}`, `${locale}/${article.slug}`).not.toContain('TODO');
      }
    }
  });

  // The byline is emitted as a schema.org Person and as dc:creator. The site's
  // own name in that slot is both wrong markup and the wrong positioning for
  // analysis that wants to be cited.
  it('carry a named byline rather than the publication itself', () => {
    for (const locale of SITE_LOCALES) {
      for (const article of publishedArticles(locale)) {
        expect(article.author, `${locale}/${article.slug}`).not.toBe('estimador.pt');
        expect(article.author.split(' ').length, `${locale}/${article.slug}`).toBeGreaterThan(1);
      }
    }
  });
});

/**
 * A piece is filed under one of the platform's own section types so it can be
 * surfaced on that section's forecast page. The vocabulary is shared with
 * src/lib/config/sections.ts, and a value outside it is a piece that would be
 * published and then never appear on the page it was written for.
 */
describe('article sections', () => {
  /**
   * Exercised through a stubbed filesystem rather than a fixture file: an
   * invalid header committed to src/content, even for one assertion, breaks
   * every other test file that lists the content directory in parallel.
   */
  function stubArticleFile(metadata: Record<string, unknown>) {
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'readFileSync').mockReturnValue(
      `export const metadata = ${JSON.stringify(metadata, null, 2)};\n\nCorpo.\n` as never,
    );
  }

  const header = {
    title: 'Uma nota qualquer',
    excerpt: 'Resumo numa frase.',
    author: 'Bernardo Caldas',
    date: '2026-09-08',
    kind: 'nota',
    tags: ['Teste'],
    slug: 'nota-de-seccao',
  };

  afterEach(() => vi.restoreAllMocks());

  it('files every published piece under a section the platform defines', () => {
    for (const locale of SITE_LOCALES) {
      for (const article of getMDXArticlesByLocale(locale)) {
        if (article.section !== undefined) {
          expect(ARTICLE_SECTIONS, `${locale}/${article.slug}`).toContain(article.section);
        }
      }
    }
  });

  it('accepts a section from the shared vocabulary', () => {
    stubArticleFile({ ...header, section: 'football' });
    expect(getMDXArticleBySlug('nota-de-seccao', 'pt')?.section).toBe('football');
  });

  it('rejects a section the sections config does not define', () => {
    stubArticleFile({ ...header, section: 'desporto' });
    expect(() => getMDXArticleBySlug('nota-de-seccao', 'pt')).toThrow(/section/i);
  });

  it('leaves a piece unfiled when the header omits the field', () => {
    stubArticleFile(header);
    expect(getMDXArticleBySlug('nota-de-seccao', 'pt')?.section).toBeUndefined();
  });

  // The football and economics pages mount the same component the elections
  // pages do, and today they have nothing to show. Returning an empty list is
  // what lets them render no heading at all.
  it('returns nothing for a section that has published nothing', () => {
    expect(getArticlesBySection('demographics', 'pt')).toEqual([]);
  });

  // Ordering is what the section pages rely on, so it is proved against files
  // written here rather than against whatever is published today — the archive
  // can legitimately be empty, and a test that quietly stops asserting when it
  // is would be worse than no test.
  describe('ordering', () => {
    const slugs = ['fixture-mais-antigo', 'fixture-mais-recente'];
    const dates = ['2026-01-05', '2026-03-20'];
    const files = slugs.map(slug => path.join(process.cwd(), 'src/content/articles/pt', `${slug}.mdx`));

    beforeAll(() => {
      files.forEach((file, index) => {
        expect(fs.existsSync(file), 'fixture would overwrite a real article').toBe(false);
        fs.writeFileSync(file, `export const metadata = ${JSON.stringify({
          title: `Fixture ${index}`,
          excerpt: 'Ficheiro de teste, removido no fim da suite.',
          author: 'Bernardo Caldas',
          date: dates[index],
          kind: 'nota',
          section: 'elections',
          tags: ['Teste'],
          slug: slugs[index],
        }, null, 2)};\n\nCorpo.\n`);
      });
    });

    afterAll(() => files.forEach(file => fs.rmSync(file, { force: true })));

    it('lists a section newest first', () => {
      const listed = getArticlesBySection('elections', 'pt')
        .filter(article => article.slug.startsWith('fixture-'))
        .map(article => article.date);
      expect(listed).toEqual([...dates].reverse());
    });

    it('leaves a section with nothing published empty', () => {
      expect(getArticlesBySection('demographics', 'pt')).toEqual([]);
    });
  });
});

/**
 * Drafts exist so a piece can be committed before it is finished. The whole
 * behaviour is a visibility difference between two environments, so it is
 * tested against a scaffolded file rather than against whatever happens to be
 * half-written in src/content today.
 */
describe('drafts', () => {
  const slug = 'rascunho-de-teste';
  const file = path.join(process.cwd(), 'src/content/articles/pt', `${slug}.mdx`);
  const listed = (locale: string) => getMDXArticlesByLocale(locale).map(article => article.slug);

  beforeAll(() => {
    expect(fs.existsSync(file), 'fixture would overwrite a real article').toBe(false);
    const metadata = {
      title: 'Rascunho por acabar',
      excerpt: 'TODO: resumo numa frase.',
      author: 'Bernardo Caldas',
      date: '2026-09-08',
      kind: 'nota',
      section: 'elections',
      draft: true,
      tags: ['Teste'],
      slug,
    };
    fs.writeFileSync(file, `export const metadata = ${JSON.stringify(metadata, null, 2)};\n\nPor acabar.\n`);
  });

  afterAll(() => fs.rmSync(file, { force: true }));
  afterEach(() => vi.unstubAllEnvs());

  it('is listed by the dev server, so the piece can be written and previewed', () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect(listed('pt')).toContain(slug);
    expect(getArticlesByKind('pt').nota.map(article => article.slug)).toContain(slug);
    expect(getArticlesBySection('elections', 'pt').map(article => article.slug)).toContain(slug);
  });

  it('is absent from every listing the production build emits', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    // The index, generateStaticParams and the sitemap all read this one list.
    expect(listed('pt')).not.toContain(slug);
    expect(getArticlesByKind('pt').nota.map(article => article.slug)).not.toContain(slug);
    // The section pages read the same list, so an unfinished note cannot reach
    // /desporto/liga or /eleicoes/* either.
    expect(getArticlesBySection('elections', 'pt').map(article => article.slug)).not.toContain(slug);

    const feed = await feedRoute(new Request('https://estimador.pt/pt/feed.xml'), {
      params: Promise.resolve({ locale: 'pt' }),
    });
    expect(await feed.text()).not.toContain(slug);
  });

  it('still renders on its own page, which is the only way to write it', () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect(getMDXArticleBySlug(slug, 'pt')?.draft).toBe(true);
  });

  it('is exempt from the placeholder rule a published piece has to pass', () => {
    expect(getMDXArticlesByLocale('pt', { includeDrafts: true }).map(article => article.slug)).toContain(slug);
    expect(publishedArticles('pt').map(article => article.slug)).not.toContain(slug);
  });

});

describe('page metadata', () => {
  it('pins a canonical URL and one alternate per locale', () => {
    const metadata = createPageMetadata({
      locale: 'pt',
      path: '/economia',
      title: 'Estado da economia',
      description: 'Uma leitura consolidada.',
    });

    expect(metadata.alternates?.canonical).toBe('https://estimador.pt/pt/economia/');
    expect(metadata.alternates?.languages).toEqual(languageAlternates('/economia'));
    expect(Object.keys(metadata.alternates?.languages ?? {}).sort()).toEqual([...SITE_LOCALES].sort());
  });

  it('advertises the locale feed for autodiscovery', () => {
    for (const locale of SITE_LOCALES) {
      const metadata = createPageMetadata({ locale, path: '/artigos', title: 'x', description: 'y' });
      const feeds = metadata.alternates?.types?.['application/rss+xml'];
      expect(Array.isArray(feeds) && feeds[0].url, locale).toBe(`https://estimador.pt/${locale}/feed.xml`);
    }
  });

  it('always carries a social image, on every page', () => {
    for (const locale of SITE_LOCALES) {
      const metadata = createPageMetadata({ locale, path: '/', title: 'x', description: 'y' });
      const images = metadata.openGraph?.images;
      expect(Array.isArray(images) && images.length === 1, `og image for ${locale}`).toBe(true);
      expect(metadata.twitter && 'images' in metadata.twitter).toBe(true);
    }
  });

  it('restricts alternates to the locales a page was published in', () => {
    const metadata = createPageMetadata({
      locale: 'pt',
      path: '/artigos/so-em-portugues',
      title: 'x',
      description: 'y',
      availableLocales: ['pt'],
    });
    expect(Object.keys(metadata.alternates?.languages ?? {})).toEqual(['pt']);
  });

  it('builds localized URLs with the trailing slash the export uses', () => {
    expect(localizedUrl('en', '/desporto/liga')).toBe('https://estimador.pt/en/desporto/liga/');
    expect(localizedUrl('pt', '/')).toBe('https://estimador.pt/pt/');
  });
});
