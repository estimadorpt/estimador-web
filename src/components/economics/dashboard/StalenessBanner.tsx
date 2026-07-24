'use client';

// Render-time staleness guard for the economy dashboard.
//
// The site is a static export: server output is frozen at BUILD time, and the
// data payload only changes when the publish pipeline pushes. Both can silently
// stall — so this component re-computes freshness on the CLIENT after mount:
//
//  1. If the payload's as_of is more than STALE_BUSINESS_DAYS business days old,
//     a prominent amber banner says so ("Dados de {date} — esta página não
//     reflete ainda os indicadores mais recentes").
//  2. The quarter-position line (M1/M2/M3 / "quarter ended, awaiting the INE
//     flash") is derived from the CURRENT date, never from the payload — a
//     stale payload can never claim "mid-quarter" after quarter end.
//
// Before mount (and with JS disabled) nothing extra renders — the payload's own
// vintage line remains, which is factual about the payload, not about "now".

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle } from 'lucide-react';
import { businessDaysSince, positionForDate, type QuarterNow } from '@/lib/utils/economy-time';
import { fmtDate } from '@/lib/utils/economy-format';

export const STALE_BUSINESS_DAYS = 5;

interface Freshness {
  businessDays: number | null;
  stale: boolean;
  quarterNow: QuarterNow | null;
}

function computeFreshness(asOf?: string, targetQuarter?: string): Freshness {
  const businessDays = businessDaysSince(asOf ?? null);
  return {
    businessDays,
    stale: businessDays !== null && businessDays > STALE_BUSINESS_DAYS,
    quarterNow: positionForDate(targetQuarter ?? null),
  };
}

/** Hook shared by the banner and the narrative demotion. Client-side only. */
function useFreshness(asOf?: string, targetQuarter?: string): Freshness | null {
  const [freshness, setFreshness] = useState<Freshness | null>(null);
  useEffect(() => {
    setFreshness(computeFreshness(asOf, targetQuarter));
  }, [asOf, targetQuarter]);
  return freshness;
}

export function StalenessBanner({
  asOf,
  vintageDate,
  targetQuarter,
  payloadPosition,
  locale,
}: {
  asOf?: string;
  vintageDate?: string;
  targetQuarter?: string;
  payloadPosition?: string;
  locale: string;
}) {
  const t = useTranslations('economics');
  const freshness = useFreshness(asOf ?? vintageDate, targetQuarter);
  if (!freshness) return null;

  const { stale, quarterNow } = freshness;
  const dateLabel = fmtDate(vintageDate ?? asOf, locale);

  // Position line: only needed when the calendar disagrees with the payload —
  // i.e. the target quarter has ended, or the month-position moved on.
  const positionMismatch =
    quarterNow !== null &&
    (quarterNow.position === 'ended' ||
      (payloadPosition &&
        ['M1', 'M2', 'M3'].includes(quarterNow.position) &&
        quarterNow.position !== payloadPosition));

  if (!stale && !positionMismatch) return null;

  return (
    <div
      role="status"
      className="rounded-lg border-l-4 border-l-amber-500 border-y border-r border-amber-200 bg-amber-50 p-4"
    >
      {stale && (
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-900">
              {t('staleBanner', { date: dateLabel })}
            </p>
            <p className="mt-0.5 text-xs text-amber-800">{t('staleBannerDetail')}</p>
          </div>
        </div>
      )}
      {positionMismatch && quarterNow && (
        <p className={`text-xs text-amber-800 ${stale ? 'mt-2 pl-6' : ''}`}>
          {quarterNow.position === 'ended'
            ? t('quarterEndedNote', {
                quarter: targetQuarter ?? '—',
                position: payloadPosition ?? '—',
              })
            : t('positionNowNote', {
                position: quarterNow.position,
                payloadPosition: payloadPosition ?? '—',
              })}
        </p>
      )}
    </div>
  );
}

/**
 * Narrative lede with staleness demotion. While the payload is fresh it renders
 * the narrative as the page's plain-language summary; once stale, the text is
 * visually demoted and prefixed with a past-tense date framing so present-tense
 * claims ("is growing", "está a acelerar") cannot read as current.
 */
export function StaleAwareNarrative({
  text,
  generatedBy,
  byLabel,
  asOf,
  vintageDate,
  locale,
}: {
  text?: string;
  generatedBy?: string;
  byLabel: string;
  asOf?: string;
  vintageDate?: string;
  locale: string;
}) {
  const t = useTranslations('economics');
  const freshness = useFreshness(asOf ?? vintageDate);
  if (!text) return null;

  const stale = freshness?.stale === true;
  const dateLabel = fmtDate(vintageDate ?? asOf, locale);

  return (
    <section className={`border-l-2 pl-4 ${stale ? 'border-amber-300' : 'border-stone-300'}`}>
      {stale && (
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-amber-700">
          {t('staleNarrativeNote', { date: dateLabel })}
        </p>
      )}
      <p
        className={`text-base md:text-lg leading-relaxed max-w-4xl ${
          stale ? 'text-stone-500' : 'text-stone-700'
        }`}
      >
        {text}
      </p>
      {generatedBy && (
        <p className="mt-1.5 text-[10px] text-stone-400">
          {byLabel}: {generatedBy}
        </p>
      )}
    </section>
  );
}
