// Graceful "unavailable" state for any tile that arrives as
// { status: "unavailable", reason } or is missing entirely. The page must never
// crash on a missing tile — render this instead. Missing data is said in words:
// it is never shown as a zero.

import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';

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
      className={`flex gap-5 border-t border-rule pt-3 ${className}`}
    >
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex items-start justify-between gap-3">
          <h2 className="text-base text-graphite md:text-lg">
            {title}
          </h2>
          <span className="text-[12px] font-semibold text-graphite">
            {t('unavailableBadge')}
          </span>
        </div>
        <p className="text-sm text-graphite">{reason || t('unavailable')}</p>
        <Link href="/economia/metodologia" locale={locale} className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-ink underline-offset-4 hover:underline">
          {t('methodologyLink')}
        </Link>
      </div>
    </section>
  );
}
