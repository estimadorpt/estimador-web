// Graceful "unavailable" state for any tile that arrives as
// { status: "unavailable", reason } or is missing entirely. The page must never
// crash on a missing tile — render this instead.

import { getTranslations } from 'next-intl/server';

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
      className={`rounded-lg border border-dashed border-stone-300 bg-stone-50 p-5 md:p-6 ${className}`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h2 className="text-base md:text-lg font-bold tracking-tight text-stone-500">
          {title}
        </h2>
        <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-stone-200 text-stone-500">
          {t('unavailableBadge')}
        </span>
      </div>
      <p className="text-sm text-stone-500">{reason || t('unavailable')}</p>
    </section>
  );
}
