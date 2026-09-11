import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { Rss } from 'lucide-react';

/**
 * Buttondown's embed endpoint: https://buttondown.com/api/emails/embed-subscribe/<username>
 *
 * Unset — the state on a fresh clone and in any build without the secret — the
 * card still renders, minus the form. A feed is a real way to follow the site
 * and it needs no address, so there is always something honest to offer.
 */
const ENDPOINT = process.env.NEXT_PUBLIC_NEWSLETTER_ENDPOINT;

interface SubscribeProps {
  /** `page` sits at the end of a piece; `inline` is the denser index footer. */
  variant?: 'page' | 'inline';
}

/**
 * A plain form post, deliberately — not a fetch.
 *
 * Buttondown's API sends no CORS headers, and its own documentation says not to
 * submit this endpoint with fetch: the response is sometimes a CAPTCHA or a
 * validation page the subscriber has to see. A background request would fail
 * silently on a cross-origin error and report a failure the reader could not
 * act on, which is worse than the navigation.
 *
 * The alternative that would keep the reader here is Buttondown's iframe embed,
 * and it is the wrong trade for this site: an iframe contacts Buttondown on
 * every article view, handing over the IP and referrer of readers who never
 * subscribed, which is precisely what /privacidade promises does not happen.
 */
export async function Subscribe({ variant = 'page' }: SubscribeProps) {
  const t = await getTranslations('subscribe');
  // The feeds are per locale; /feed.xml only redirects to the Portuguese one.
  const locale = await getLocale();
  const compact = variant === 'inline';

  return (
    <aside
      className={`border-t border-stone-200 bg-stone-50 ${compact ? 'px-5 py-6' : 'px-6 py-8'}`}
      aria-labelledby="subscribe-heading"
    >
      <div className="max-w-2xl">
        <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-2">
          {t('eyebrow')}
        </p>
        <h2 id="subscribe-heading" className={`font-semibold text-stone-900 ${compact ? 'text-lg' : 'text-xl'} mb-2`}>
          {t('title')}
        </h2>
        <p className="text-stone-600 leading-relaxed mb-5">{t('body')}</p>

        {ENDPOINT && (
          <form action={ENDPOINT} method="post" target="_blank" rel="noopener" className="mb-4 flex flex-col gap-2 sm:flex-row">
            <label htmlFor="subscribe-email" className="sr-only">{t('emailLabel')}</label>
            <input
              id="subscribe-email"
              type="email"
              name="email"
              required
              autoComplete="email"
              placeholder={t('placeholder')}
              className="min-h-12 min-w-0 flex-1 rounded-[10px] border border-stone-300 bg-cream px-4 text-stone-900 placeholder:text-stone-400"
            />
            <button
              type="submit"
              className="inline-flex min-h-12 items-center justify-center rounded-[10px] bg-ink px-5 text-[15px] font-semibold text-paper transition-colors hover:bg-ink-dark"
            >
              {t('cta')}
            </button>
          </form>
        )}

        {ENDPOINT && <p className="mb-3 text-sm text-stone-500">{t('confirm')}</p>}

        <p className="text-sm text-stone-500">
          <a
            href={`/${locale}/feed.xml`}
            className="inline-flex items-center gap-1.5 font-medium text-stone-700 hover:text-stone-900 hover:underline"
          >
            <Rss aria-hidden="true" className="h-3.5 w-3.5" />
            {t('rss')}
          </a>
          {ENDPOINT && (
            <>
              {' · '}
              <Link href="/privacidade" className="hover:text-stone-800 hover:underline">
                {t('privacy')}
              </Link>
            </>
          )}
        </p>
      </div>
    </aside>
  );
}
