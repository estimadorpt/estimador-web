import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { Rss } from 'lucide-react';
import { Action } from '@/components/brand/Action';

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
  /**
   * The page's locale. Pass it: in the static export an implicit getLocale()
   * only knows the locale when the page called setRequestLocale, and an
   * English page that forgot would end with a Portuguese card pointing at the
   * Portuguese feed.
   */
  locale?: string;
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
export async function Subscribe({ variant = 'page', locale: localeProp }: SubscribeProps) {
  // The feeds are per locale; /feed.xml only redirects to the Portuguese one.
  const locale = localeProp ?? (await getLocale());
  const t = await getTranslations({ locale, namespace: 'subscribe' });
  const compact = variant === 'inline';

  return (
    <aside
      className={`border-t border-stone-200 bg-stone-50 ${compact ? 'px-5 py-6' : 'px-6 py-8'}`}
      aria-labelledby="subscribe-heading"
    >
      <div className="max-w-2xl">
        <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-2">
          {ENDPOINT ? t('eyebrow') : t('eyebrowFeed')}
        </p>
        <h2 id="subscribe-heading" className={`font-semibold text-stone-900 ${compact ? 'text-lg' : 'text-xl'} mb-2`}>
          {ENDPOINT ? t('title') : t('titleFeed')}
        </h2>
        {/* The promise has to match the capability: only offer email delivery
            when NEXT_PUBLIC_NEWSLETTER_ENDPOINT is actually configured. */}
        <p className="text-stone-600 leading-relaxed mb-5">{ENDPOINT ? t('body') : t('bodyFeed')}</p>

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
            <Action type="submit">{t('cta')}</Action>
          </form>
        )}

        {ENDPOINT && <p className="mb-3 text-sm text-stone-500">{t('confirm')}</p>}

        <p className="text-sm text-stone-500">
          <a
            href={`/${locale}/feed.xml`}
            className="inline-flex items-center gap-1.5 font-medium text-ink underline underline-offset-4 hover:text-ink-dark"
          >
            <Rss aria-hidden="true" className="h-3.5 w-3.5" />
            {t('rss')}
          </a>
          {ENDPOINT && (
            <>
              {' · '}
              <Link href="/privacidade" locale={locale} className="text-ink underline underline-offset-4 hover:text-ink-dark">
                {t('privacy')}
              </Link>
            </>
          )}
        </p>
      </div>
    </aside>
  );
}
