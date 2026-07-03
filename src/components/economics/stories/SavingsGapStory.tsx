// Savings-gap story: official BdP deposit rates vs official HICP inflation and
// Euribor 6M — the real-return arithmetic is stated in the headline; the chart
// shows the four official monthly series since 2015 (per-series periods differ
// and are shown next to each number).

import { getTranslations } from 'next-intl/server';
import { StoryCard } from './StoryCard';
import { StoryLineChart, StoryChartLegend } from './StoryLineChart';
import { COLORS } from '@/lib/utils/economy-format';
import {
  fmtPctLoc,
  fmtSignedPctLoc,
  fmtNumLoc,
  fmtMonthLoc,
} from '@/lib/utils/story-format';
import { pickText, type SavingsGapModule } from '@/types/economy-stories';

function isNum(v: number | null | undefined): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

export async function SavingsGapStory({
  data,
  locale,
}: {
  data: SavingsGapModule;
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: 'economics' });
  const chart = (data?.chart_monthly ?? []).filter((p) => p && p.month);
  const real = data?.real_deposit_return_pct;

  // Legend shows each series' latest AVAILABLE value (series end in different
  // months — e.g. deposit rates lag Euribor/HICP).
  const lastFinite = (key: keyof (typeof chart)[number]): number | null => {
    for (let i = chart.length - 1; i >= 0; i--) {
      const v = chart[i]?.[key];
      if (typeof v === 'number' && Number.isFinite(v)) return v;
    }
    return null;
  };
  const legendVal = (v: number | null | undefined) => fmtNumLoc(v, locale, 2);

  return (
    <StoryCard
      title={data?.title}
      badge={data?.badge}
      asOf={data?.as_of}
      headline={data?.headline}
      honesty={pickText(locale, data?.honesty_note_i18n)}
      locale={locale}
    >
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 tabular-nums">
        <span>
          <span className="text-3xl font-black tracking-tight text-stone-900">
            {fmtPctLoc(data?.deposit_rate_new_time?.value_pct, locale, 2)}
          </span>
          <span className="text-xs text-stone-500">
            {' '}
            {t('savingsDeposit')} ({fmtMonthLoc(data?.deposit_rate_new_time?.period, locale)})
          </span>
        </span>
        <span>
          <span className="text-3xl font-black tracking-tight text-stone-900">
            {fmtPctLoc(data?.hicp_yoy?.value_pct, locale, 1)}
          </span>
          <span className="text-xs text-stone-500">
            {' '}
            {t('savingsHicp')} ({fmtMonthLoc(data?.hicp_yoy?.period, locale)})
          </span>
        </span>
        <span>
          <span
            className="text-3xl font-black tracking-tight"
            style={{
              color: isNum(real) ? (real >= 0 ? COLORS.teal : COLORS.red) : COLORS.stoneDark,
            }}
          >
            {fmtSignedPctLoc(real, locale, 1)}
          </span>
          <span className="text-xs text-stone-500"> {t('savingsRealReturn')}</span>
        </span>
      </div>

      {chart.length >= 2 && (
        <div className="mt-4">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
            {t('savingsChartTitle')}
          </h4>
          <StoryLineChart
            ariaLabel={t('savingsChartTitle')}
            series={[
              {
                label: t('savingsHicp'),
                color: COLORS.amber,
                values: chart.map((p) => p.hicp_yoy_pct ?? null),
              },
              {
                label: 'Euribor 6M',
                color: COLORS.tealLight,
                values: chart.map((p) => p.euribor_6m_pct ?? null),
              },
              {
                label: t('savingsDeposit'),
                color: COLORS.teal,
                values: chart.map((p) => p.deposit_new_time_pct ?? null),
              },
              {
                label: t('savingsOvernight'),
                color: COLORS.stone,
                dashed: true,
                values: chart.map((p) => p.overnight_pct ?? null),
              },
            ]}
            xStartLabel={fmtMonthLoc(chart[0]?.month, locale)}
            xEndLabel={fmtMonthLoc(chart[chart.length - 1]?.month, locale)}
            yFmt={(v) => `${fmtNumLoc(v, locale, 0)}%`}
            height={200}
          />
          <StoryChartLegend
            items={[
              {
                label: t('savingsHicp'),
                color: COLORS.amber,
                value: legendVal(lastFinite('hicp_yoy_pct')),
              },
              {
                label: 'Euribor 6M',
                color: COLORS.tealLight,
                value: legendVal(lastFinite('euribor_6m_pct')),
              },
              {
                label: t('savingsDeposit'),
                color: COLORS.teal,
                value: legendVal(lastFinite('deposit_new_time_pct')),
              },
              {
                label: t('savingsOvernight'),
                color: COLORS.stone,
                dashed: true,
                value: legendVal(lastFinite('overnight_pct')),
              },
            ]}
          />
        </div>
      )}
    </StoryCard>
  );
}
