import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { articleExistsInLocale, type MDXArticleMetadata } from '@/lib/mdx-articles';
import { SITE_LOCALES } from '@/lib/metadata';

/**
 * One line in a list of pieces — the index, a tag page, anywhere a set of
 * articles is enumerated.
 *
 * Notes lead with when; explainers lead with what. Same markup, one switch — a
 * reference piece dated three years ago is not stale, and putting its date
 * first is the fastest way to imply that it is.
 *
 * Tags are deliberately plain text here rather than links to their tag pages:
 * the whole row is already an anchor, and an anchor inside an anchor is invalid
 * markup that browsers resolve by dropping one of them. Tag links live where
 * they are not nested — the article page header and the topic index.
 */
export async function ArticleRow({
  article,
  locale,
}: {
  article: MDXArticleMetadata;
  locale: string;
}) {
  const t = await getTranslations({ locale });
  const dateFormat = new Intl.DateTimeFormat(locale === 'pt' ? 'pt-PT' : 'en-GB', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  const translated = SITE_LOCALES.every(candidate => articleExistsInLocale(article.slug, candidate));

  return (
    <li className="border-b border-rule">
      <Link
        href={`/artigos/${article.slug}`}
        locale={locale}
        className="group block py-6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2 text-[12px] font-semibold text-graphite">
          {article.kind === 'nota' && (
            <time dateTime={article.date}>{dateFormat.format(new Date(article.date))}</time>
          )}
          {article.tags.map(tag => (
            <span key={tag} className="text-stone-400">{tag}</span>
          ))}
          {!translated && (
            <span className="text-ink">
              {t('articles.onlyInPortuguese')}
            </span>
          )}
        </div>
        <h3 className="text-xl text-ink group-hover:text-ink mb-1.5">
          {article.title}
        </h3>
        <p className="text-graphite leading-relaxed max-w-2xl">{article.excerpt}</p>
        <p className="mt-2 text-xs text-graphite">
          {article.kind === 'explicador' && <>{dateFormat.format(new Date(article.date))} · </>}
          {t('articles.by')} {article.author} · {article.readTime} {t('articles.readTimeSuffix')}
        </p>
      </Link>
    </li>
  );
}
