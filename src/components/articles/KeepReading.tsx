import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import type { MDXArticleMetadata } from '@/lib/mdx-articles';

/**
 * The end of a piece, which until now was the end of the site.
 *
 * Headed "keep reading" rather than "related": with a handful of pieces
 * published, the ranking in article-discovery falls back to recency once the
 * shared tags run out, and a heading that promised relatedness would be making
 * a claim the archive cannot yet support.
 *
 * Renders nothing when there is nothing to offer, which is the state on a site
 * with one article — an empty "keep reading" box is a worse dead end than the
 * plain back link underneath it.
 */
export async function KeepReading({
  articles,
  locale,
}: {
  articles: MDXArticleMetadata[];
  locale: string;
}) {
  if (!articles.length) return null;

  const t = await getTranslations({ locale });
  const dateFormat = new Intl.DateTimeFormat(locale === 'pt' ? 'pt-PT' : 'en-GB', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <section className="mt-12 border-t-2 border-stone-800 pt-3">
      <h2 className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
        {t('articles.keepReading')}
      </h2>
      <ul className="mt-1">
        {articles.map(article => (
          <li key={article.slug} className="border-b border-stone-200">
            <Link
              href={`/artigos/${article.slug}`}
              locale={locale}
              className="group block py-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              <div className="mb-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold uppercase tracking-wider text-stone-500">
                <span className="text-stone-800">
                  {t(article.kind === 'nota' ? 'articles.kindNota' : 'articles.kindExplicador')}
                </span>
                <time dateTime={article.date}>{dateFormat.format(new Date(article.date))}</time>
              </div>
              <h3 className="text-base leading-snug text-stone-900 group-hover:text-ink">
                {article.title}
              </h3>
              <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-stone-600">
                {article.excerpt}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
