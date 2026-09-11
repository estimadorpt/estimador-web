import { getMDXArticlesByLocale } from '@/lib/mdx-articles';
import { SITE_LOCALES, localizedUrl, feedUrl } from '@/lib/metadata';

/**
 * One RSS feed per locale, exported as a static file at /pt/feed.xml.
 *
 * Items carry the summary and a link rather than the full body: an article
 * here can mount a live chart component, and an <iframe>-less reader would
 * show a hole where the argument is. The feed's job is to say a piece exists.
 */

export const dynamic = 'force-static';

export function generateStaticParams() {
  return SITE_LOCALES.map(locale => ({ locale }));
}

const FEED_TITLE: Record<string, string> = {
  pt: 'estimador.pt — notas e explicadores',
  en: 'estimador.pt — notes and explainers',
};

const FEED_DESCRIPTION: Record<string, string> = {
  pt: 'Previsões e análises sobre Portugal, com a incerteza à vista: economia, Liga Portugal, eleições e população.',
  en: 'Forecasts and analysis on Portugal, with the uncertainty in plain sight: the economy, Liga Portugal, elections and population.',
};

function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, character => (
    { '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[character]!
  ));
}

export async function GET(_request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const articles = getMDXArticlesByLocale(locale).slice(0, 50);
  const self = feedUrl(locale);

  // Dated from the newest item, not from the build. A data site rebuilds many
  // times a day; a lastBuildDate that moves without the content moving trains
  // readers and aggregators to ignore it.
  const newest = articles[0]?.updated ?? articles[0]?.date;

  const items = articles.map(article => {
    const url = localizedUrl(locale, `/artigos/${article.slug}`);
    return `    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <pubDate>${new Date(`${article.date}T00:00:00Z`).toUTCString()}</pubDate>
      <description>${escapeXml(article.excerpt)}</description>
      <dc:creator>${escapeXml(article.author)}</dc:creator>
${article.tags.map(tag => `      <category>${escapeXml(tag)}</category>`).join('\n')}
    </item>`;
  }).join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(FEED_TITLE[locale] ?? FEED_TITLE.pt)}</title>
    <link>${escapeXml(localizedUrl(locale, '/artigos'))}</link>
    <description>${escapeXml(FEED_DESCRIPTION[locale] ?? FEED_DESCRIPTION.pt)}</description>
    <language>${locale === 'pt' ? 'pt-PT' : 'en-GB'}</language>
    <atom:link href="${escapeXml(self)}" rel="self" type="application/rss+xml" />
${newest ? `    <lastBuildDate>${new Date(`${newest}T00:00:00Z`).toUTCString()}</lastBuildDate>\n` : ''}${items}
  </channel>
</rss>
`;

  return new Response(body, {
    headers: { 'content-type': 'application/rss+xml; charset=utf-8' },
  });
}
