import { Link } from '@/i18n/routing';
import { tagSlug } from '@/lib/article-discovery';

/**
 * The tags in an article header, as links to their topic pages.
 *
 * `locale` is the locale of the article the tags belong to, which is not always
 * the locale being browsed: an English reader looking at a Portuguese-only
 * piece sees Portuguese tags, and those topic pages only exist under /pt.
 *
 * A tag that slugifies to nothing — punctuation only — is still printed, just
 * not linked. It is a labelling mistake, not a reason to lose the label.
 */
export function TagLinks({ tags, locale }: { tags: string[]; locale: string }) {
  return (
    <>
      {tags.map(tag => {
        const slug = tagSlug(tag);
        if (!slug) return <span key={tag} className="text-stone-400">{tag}</span>;
        return (
          <Link
            key={tag}
            href={`/artigos/tema/${slug}`}
            locale={locale}
            className="text-stone-400 underline decoration-stone-200 underline-offset-4 hover:text-stone-800 hover:decoration-stone-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            {tag}
          </Link>
        );
      })}
    </>
  );
}
