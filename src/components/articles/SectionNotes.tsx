import { getTranslations } from 'next-intl/server';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { getArticlesBySection, type ArticleSection } from '@/lib/mdx-articles';

/**
 * The written analysis for one forecast surface, shown on that surface.
 *
 * A note about Liga Portugal published only to /artigos is a note nobody
 * reads: the traffic arrives at the forecast page and leaves from it. This is
 * the bridge, and it points back at the index rather than duplicating it.
 *
 * Renders nothing when the section has published nothing — the usual state for
 * three of the four sections today. A heading over an empty list reads as a
 * broken page, and it would sit in the middle of an otherwise finished one.
 *
 * The four pages it mounts on share no layout: one is a full-bleed stack of
 * bordered sections, one a max-w-5xl tile grid, one an archive of cards. So the
 * block takes its frame from the page instead of imposing one — and it has to
 * own that frame rather than let the page wrap it, or the empty case would
 * leave the wrapper behind and ship a bare hairline.
 */
export async function SectionNotes({
  section,
  locale,
  className = '',
  containerClassName = '',
  limit = 3,
}: {
  section: ArticleSection;
  locale: string;
  /** Frame of the block within the page: borders, background, vertical rhythm. */
  className?: string;
  /** Width and padding the host page uses for its own content. */
  containerClassName?: string;
  limit?: number;
}) {
  const articles = getArticlesBySection(section, locale).slice(0, limit);
  if (!articles.length) return null;

  const t = await getTranslations({ locale });
  const dateFormat = new Intl.DateTimeFormat(locale === 'pt' ? 'pt-PT' : 'en-GB', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <section className={className}>
      <div className={containerClassName}>
        <h2 className="text-2xl tracking-tight text-stone-900 mb-1">
          {t('articles.sectionHeading')}
        </h2>
        <p className="text-sm text-stone-500 mb-4">{t('articles.sectionIntro')}</p>

        <ul className="border-t border-stone-200">
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
                <p className="mt-1 text-sm leading-relaxed text-stone-600 max-w-2xl">
                  {article.excerpt}
                </p>
              </Link>
            </li>
          ))}
        </ul>

        <Link
          href="/artigos"
          locale={locale}
          className="group mt-4 inline-flex items-center gap-1 text-sm font-medium text-ink hover:text-ink-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          {t('articles.viewAll')}
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </section>
  );
}
