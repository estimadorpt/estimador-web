import { describe, expect, it } from 'vitest';
import { buildTagIndex, findTagGroup, relatedArticles, tagSlug } from './article-discovery';
import { getMDXArticlesByLocale } from './mdx-articles';
import type { MDXArticleMetadata } from './mdx-articles';
import { SITE_LOCALES } from './metadata';

function article(partial: Partial<MDXArticleMetadata> & { slug: string }): MDXArticleMetadata {
  return {
    title: partial.slug,
    excerpt: 'x',
    author: 'estimador.pt',
    date: '2026-01-01',
    kind: 'nota',
    tags: [],
    readTime: '1 min',
    ...partial,
  };
}

describe('tagSlug', () => {
  it('strips accents and case so one tag keeps one URL', () => {
    expect(tagSlug('Análise partidária')).toBe('analise-partidaria');
    expect(tagSlug('Guia de leitura')).toBe('guia-de-leitura');
    expect(tagSlug('Sondagens')).toBe('sondagens');
    expect(tagSlug('Liga Portugal')).toBe('liga-portugal');
  });

  it('collapses spellings of the same tag onto the same segment', () => {
    expect(tagSlug('SONDAGENS')).toBe(tagSlug('sondagens'));
    expect(tagSlug('Formação de governo')).toBe(tagSlug('Formacao de Governo'));
  });

  it('never emits a segment that would need escaping', () => {
    expect(tagSlug('  Chega!!  ')).toBe('chega');
    expect(tagSlug('D’Hondt & mandatos')).toBe('d-hondt-mandatos');
    for (const tag of getMDXArticlesByLocale('pt').flatMap(item => item.tags)) {
      expect(tagSlug(tag), tag).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });

  it('returns nothing routable for a tag with no letters or digits', () => {
    expect(tagSlug('—')).toBe('');
  });
});

describe('buildTagIndex', () => {
  it('groups differently spelled tags and prints the commonest spelling', () => {
    const groups = buildTagIndex([
      article({ slug: 'a', tags: ['Sondagens'] }),
      article({ slug: 'b', tags: ['sondagens'] }),
      article({ slug: 'c', tags: ['Sondagens'] }),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].slug).toBe('sondagens');
    expect(groups[0].label).toBe('Sondagens');
    expect(groups[0].articles.map(item => item.slug)).toEqual(['a', 'b', 'c']);
  });

  it('counts an article once even when it carries the tag twice', () => {
    const groups = buildTagIndex([article({ slug: 'a', tags: ['Chega', 'chega'] })]);
    expect(groups[0].articles).toHaveLength(1);
  });

  it('drops tags that have no routable segment', () => {
    expect(buildTagIndex([article({ slug: 'a', tags: ['···'] })])).toEqual([]);
  });

  it('orders busiest first with a stable tiebreak', () => {
    const groups = buildTagIndex([
      article({ slug: 'a', tags: ['Zebra', 'Comum'] }),
      article({ slug: 'b', tags: ['Alfa', 'Comum'] }),
    ]);
    expect(groups.map(group => group.slug)).toEqual(['comum', 'alfa', 'zebra']);
  });

  // generateStaticParams enumerates this index, so a tag the article page links
  // to but the index omits is a link to a page the export never wrote.
  it('covers every tag the published articles carry, in both locales', () => {
    for (const locale of SITE_LOCALES) {
      const articles = getMDXArticlesByLocale(locale);
      const routable = new Set(buildTagIndex(articles).map(group => group.slug));
      for (const tag of articles.flatMap(item => item.tags)) {
        expect(routable.has(tagSlug(tag)), `${locale}: ${tag}`).toBe(true);
      }
    }
  });
});

describe('findTagGroup', () => {
  const articles = [article({ slug: 'a', tags: ['Análise partidária'] })];

  it('resolves the derived segment back to the tag', () => {
    expect(findTagGroup(articles, 'analise-partidaria')?.label).toBe('Análise partidária');
  });

  it('returns null rather than an empty page', () => {
    expect(findTagGroup(articles, 'inexistente')).toBeNull();
  });
});

describe('relatedArticles', () => {
  const current = article({ slug: 'atual', kind: 'nota', tags: ['Sondagens', 'Chega'], date: '2026-05-01' });
  const pool = [
    current,
    article({ slug: 'duas-tags', kind: 'explicador', tags: ['Sondagens', 'Chega'], date: '2020-01-01' }),
    article({ slug: 'uma-tag', kind: 'nota', tags: ['Chega'], date: '2020-01-01' }),
    article({ slug: 'mesmo-registo', kind: 'nota', tags: [], date: '2026-04-01' }),
    article({ slug: 'outro-registo', kind: 'explicador', tags: [], date: '2026-04-02' }),
  ];

  it('ranks shared tags above register, and register above recency', () => {
    expect(relatedArticles(current, pool, 4).map(item => item.slug))
      .toEqual(['duas-tags', 'uma-tag', 'mesmo-registo', 'outro-registo']);
  });

  it('never offers the piece being read', () => {
    expect(relatedArticles(current, pool).map(item => item.slug)).not.toContain('atual');
  });

  it('returns nothing when the piece is the only one published', () => {
    expect(relatedArticles(current, [current])).toEqual([]);
  });

  it('honours the limit so a large archive still shows a short list', () => {
    expect(relatedArticles(current, pool, 2)).toHaveLength(2);
  });

  // Two pieces published the same day is the normal case for a pair translated
  // together; ordering must not depend on readdir order.
  it('breaks a full tie on the slug', () => {
    const sameDay = [
      article({ slug: 'zeta', date: '2026-01-02' }),
      article({ slug: 'alfa', date: '2026-01-02' }),
    ];
    expect(relatedArticles(article({ slug: 'outro' }), sameDay).map(item => item.slug))
      .toEqual(['alfa', 'zeta']);
  });
});
