// Graceful "unavailable" state for any tile that arrives as
// { status: "unavailable", reason } or is missing entirely. The page must never
// crash on a missing tile — render this instead. Missing data is said in words:
// it is never shown as a zero.

import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { Mosaic } from '@/components/brand/Mosaic';

export async function UnavailableTile({
  title,
  reason,
  locale,
  className = '',
}: {
  title: string;
  reason?: string;
  locale: string;
  className?: string;
}) {
  const t = await getTranslations({ locale, namespace: 'economics' });
  return (
    <section
      className={`flex gap-5 rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-5 md:p-6 ${className}`}
    >
      <Mosaic variant="quarters" className="hidden h-16 w-16 flex-none sm:block" ground="#fcfbf5" />
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex items-start justify-between gap-3">
          <h2 className="text-base tracking-tight text-stone-500 md:text-lg">
            {title}
          </h2>
          <span className="inline-block rounded bg-stone-200 px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-stone-500">
            {t('unavailableBadge')}
          </span>
        </div>
        <p className="text-sm text-stone-500">{reason || t('unavailable')}</p>
        <Link href="/economia/metodologia" locale={locale} className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-ink underline-offset-4 hover:underline">
          {t('methodologyLink')}
        </Link>
      </div>
    </section>
  );
}
