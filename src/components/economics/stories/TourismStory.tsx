// Tourism story: official INE overnight-stay levels (via BdP/BPstat). The
// record framing is computed ONLY against the same calendar month and only
// within the stated series window (since 2013) — never "best ever".

import { getTranslations } from 'next-intl/server';
import { StoryCard } from './StoryCard';
import {
  fmtIntLoc,
  fmtSignedPctLoc,
  fmtPctLoc,
  fmtMonthLoc,
} from '@/lib/utils/story-format';
import { pickText, type TourismModule } from '@/types/economy-stories';

function isNum(v: number | null | undefined): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

export async function TourismStory({
  data,
  locale,
}: {
  data: TourismModule;
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: 'economics' });
  const total = data?.total;
  const nonRes = data?.non_residents;
  const rec = data?.same_month_record;

  // Month name alone (e.g. "maio"), for the record line.
  const monthName = (() => {
    const m = /^(\d{4})-(\d{2})/.exec(total?.period ?? '');
    if (!m) return '—';
    return new Date(Number(m[1]), Number(m[2]) - 1, 1).toLocaleDateString(
      locale === 'pt' ? 'pt-PT' : 'en-US',
      { month: 'long' }
    );
  })();

  return (
    <StoryCard
      title={data?.title}
      badge={data?.badge}
      asOf={data?.as_of}
      headline={data?.headline}
      honesty={pickText(locale, data?.honesty_note_i18n)}
      locale={locale}
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-4xl font-black tabular-nums tracking-tighter leading-none text-stone-900">
          {fmtIntLoc(total?.value, locale)}
        </span>
        <span className="text-sm text-stone-500">
          {t('tourismStays')} · {fmtMonthLoc(total?.period, locale)}
        </span>
        <span className="text-sm font-bold tabular-nums text-stone-700">
          {fmtSignedPctLoc(total?.yoy_pct, locale, 1)} {t('yoy')}
        </span>
      </div>

      <div className="mt-3 space-y-1 text-xs text-stone-600">
        {isNum(nonRes?.share_of_total_pct) && (
          <p className="tabular-nums">
            {t('tourismNonRes', {
              share: fmtPctLoc(nonRes?.share_of_total_pct, locale, 1),
              yoy: fmtSignedPctLoc(nonRes?.yoy_pct, locale, 1),
            })}
          </p>
        )}
        {rec?.rank === 1 && isNum(rec?.first_year) && (
          <p>
            {t('tourismRecord', {
              month: monthName,
              firstYear: rec.first_year,
              prevBest: rec.prev_best_year ?? '—',
            })}
          </p>
        )}
      </div>
    </StoryCard>
  );
}
