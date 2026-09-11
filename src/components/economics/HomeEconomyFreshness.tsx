'use client';

// Freshness line for the economy figures on the homepage.
//
// The homepage repeats the health score, activity and recession numbers. On a
// static export those are frozen at build time, so they need their own vintage
// beside them — and an explicit expired state once the feed stops arriving.
// The staleness test runs on the CLIENT, after mount, against the visitor's
// clock: a stale payload cannot look current just because the build was recent.

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle } from 'lucide-react';
import { businessDaysSince } from '@/lib/utils/economy-time';
import { fmtDate } from '@/lib/utils/economy-format';
import { STALE_BUSINESS_DAYS } from './dashboard/StalenessBanner';

export function HomeEconomyFreshness({
  asOf,
  vintageDate,
  locale,
}: {
  asOf?: string;
  vintageDate?: string;
  locale: string;
}) {
  const t = useTranslations('economics');
  const [stale, setStale] = useState<boolean | null>(null);

  useEffect(() => {
    const days = businessDaysSince(asOf ?? vintageDate ?? null);
    setStale(days !== null && days > STALE_BUSINESS_DAYS);
  }, [asOf, vintageDate]);

  const dateLabel = fmtDate(vintageDate ?? asOf, locale);

  if (stale) {
    return (
      <span className="inline-flex items-start gap-1.5 text-xs text-amber-800">
        <AlertTriangle aria-hidden="true" className="w-3.5 h-3.5 mt-px shrink-0 text-amber-700" />
        <span>{t('staleBanner', { date: dateLabel })}</span>
      </span>
    );
  }

  return (
    <span className="text-xs text-stone-500">
      {t('updated')} {dateLabel}
    </span>
  );
}
