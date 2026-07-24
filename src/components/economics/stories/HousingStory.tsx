// Housing story: official INE series — median NEW-lease rents (not what
// sitting tenants pay), the House Price Index (via the BdP mirror, which lags:
// stale flag rendered), and a 2015=100 chained comparison of house prices vs
// the official HICP. The wages line ships null until the INE wage-level series
// lands — we show the two available lines and say nothing about wages.

import { getTranslations } from 'next-intl/server';
import { StoryCard } from './StoryCard';
import { StoryLineChart, StoryChartLegend } from './StoryLineChart';
import { COLORS } from '@/lib/utils/economy-format';
import {
  fmtNumLoc,
  fmtSignedPctLoc,
  fmtQuarterLoc,
} from '@/lib/utils/story-format';
import { pickText, type HousingModule } from '@/types/economy-stories';

function isNum(v: number | null | undefined): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

export async function HousingStory({
  data,
  locale,
}: {
  data: HousingModule;
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: 'economics' });
  const rents = data?.new_lease_rents;
  const hpi = data?.house_prices;
  const cmp = data?.growth_comparison;
  const idx = data?.hpi_vs_wages_2015_100;

  const rows = (idx?.rows ?? []).filter((r) => isNum(r?.year));
  const haveChart = rows.filter((r) => isNum(r.hpi)).length >= 2;

  return (
    <StoryCard
      title={data?.title}
      badge={data?.badge}
      asOf={data?.as_of}
      headline={data?.headline}
      honesty={pickText(locale, data?.honesty_note_i18n)}
      locale={locale}
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-stone-200 border border-stone-200">
        <div className="bg-white p-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
            {t('housingRents')}
          </div>
          <div className="text-2xl font-black tabular-nums mt-0.5 text-stone-800">
            {fmtNumLoc(rents?.median_eur_m2, locale, 2)}
            <span className="text-xs font-bold text-stone-400"> €/m²</span>
          </div>
          <div className="text-[11px] text-stone-500 tabular-nums mt-0.5">
            {fmtSignedPctLoc(rents?.yoy_pct, locale, 1)} {t('yoy')}
          </div>
          <span className="mt-1 inline-block text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-500">
            {fmtQuarterLoc(rents?.period, locale)}
          </span>
        </div>
        <div className="bg-white p-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
            {t('housingHpi')}
          </div>
          <div className="text-2xl font-black tabular-nums mt-0.5 text-stone-800">
            {fmtSignedPctLoc(hpi?.yoy_pct, locale, 1)}
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5">{t('yoy')}</div>
          <span
            className={`mt-1 inline-block text-[10px] px-1.5 py-0.5 rounded ${
              hpi?.stale
                ? 'bg-amber-100 text-amber-800 font-semibold'
                : 'bg-stone-100 text-stone-500'
            }`}
            title={hpi?.stale ? t('labourStaleTitle') : undefined}
          >
            {fmtQuarterLoc(hpi?.period, locale)}
            {isNum(hpi?.age_days) ? ` · ${Math.round(hpi.age_days)}d` : ''}
          </span>
        </div>
        <div className="bg-white p-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
            {t('housingSince2020')}
          </div>
          <div className="text-2xl font-black tabular-nums mt-0.5 text-stone-800">
            {fmtSignedPctLoc(cmp?.new_lease_rents_pct, locale, 1)}
          </div>
          <div className="text-[11px] text-stone-500 tabular-nums mt-0.5">
            {t('housingVsHicp', {
              hicp: fmtSignedPctLoc(cmp?.hicp_pct, locale, 1),
            })}
          </div>
        </div>
      </div>

      {/* 2015=100 chained index: house prices vs consumer prices */}
      {haveChart && (
        <div className="mt-4">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
            {t('housingChartTitle')}
          </h4>
          <StoryLineChart
            ariaLabel={t('housingChartTitle')}
            series={[
              {
                label: t('housingHpiSeries'),
                color: COLORS.teal,
                values: rows.map((r) => r.hpi ?? null),
              },
              {
                label: t('housingHicpSeries'),
                color: COLORS.stoneDark,
                dashed: true,
                values: rows.map((r) => r.hicp ?? null),
              },
            ]}
            xStartLabel={String(rows[0]?.year ?? '')}
            xEndLabel={String(rows[rows.length - 1]?.year ?? '')}
            yFmt={(v) => String(Math.round(v))}
            height={170}
          />
          <StoryChartLegend
            items={[
              {
                label: t('housingHpiSeries'),
                color: COLORS.teal,
                value: fmtNumLoc(rows[rows.length - 1]?.hpi ?? null, locale, 1),
              },
              {
                label: t('housingHicpSeries'),
                color: COLORS.stoneDark,
                dashed: true,
                value: fmtNumLoc(rows[rows.length - 1]?.hicp ?? null, locale, 1),
              },
            ]}
          />
        </div>
      )}
    </StoryCard>
  );
}
