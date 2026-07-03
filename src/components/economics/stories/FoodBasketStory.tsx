// Food-basket story: official HICP y/y rates (Eurostat/INE) — headline
// aggregates plus a ranked list of tracked items with exact 5-year same-month
// cumulatives (our arithmetic on official rates; the compound badge says so).
// Item detail lags the flash headline by ~1 month — each row shows its period.

import { getTranslations } from 'next-intl/server';
import { StoryCard } from './StoryCard';
import { StatusBadge, storyBadgeKind } from '../dashboard/StatusBadge';
import { COLORS } from '@/lib/utils/economy-format';
import { fmtSignedPctLoc, fmtMonthLoc } from '@/lib/utils/story-format';
import { pickText, type FoodBasketModule } from '@/types/economy-stories';

function isNum(v: number | null | undefined): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

const AGG_ORDER = ['hicp_yoy', 'hicp_core_yoy', 'hicp_food_yoy', 'hicp_energy_yoy'];

export async function FoodBasketStory({
  data,
  locale,
}: {
  data: FoodBasketModule;
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: 'economics' });

  const aggs = AGG_ORDER.map((k) => data?.aggregates?.[k]).filter(Boolean);
  const items = (data?.items_ranked ?? []).filter((it) => isNum(it?.yoy_pct));
  const maxAbs = Math.max(1, ...items.map((it) => Math.abs(it.yoy_pct ?? 0)));
  const cum = data?.cumulative_since_5y;

  return (
    <StoryCard
      title={data?.title}
      badge={data?.badge}
      asOf={data?.as_of}
      headline={data?.headline}
      honesty={pickText(locale, data?.honesty_note_i18n)}
      locale={locale}
    >
      {/* aggregates strip */}
      {aggs.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-600 tabular-nums mb-4">
          {aggs.map((a, i) => (
            <span key={i}>
              <span className="text-stone-400">{pickText(locale, a?.label)}</span>{' '}
              <span className="font-bold">{fmtSignedPctLoc(a?.yoy_pct, locale, 1)}</span>{' '}
              <span className="text-[10px] text-stone-400">
                ({fmtMonthLoc(a?.period, locale)})
              </span>
            </span>
          ))}
        </div>
      )}

      {/* tracked items: diverging y/y bars + 5y cumulative column */}
      {items.length > 0 && (
        <div>
          <div className="grid grid-cols-[7rem_1fr_3.4rem_3.4rem] items-center gap-2 mb-1 text-[9px] font-bold uppercase tracking-wider text-stone-400">
            <span />
            <span />
            <span className="text-right">{t('yoy')}</span>
            <span className="text-right">{t('food5y')}</span>
          </div>
          <ul className="space-y-2">
            {items.map((it, i) => {
              const v = it.yoy_pct ?? 0;
              const positive = v >= 0;
              const width = (Math.abs(v) / maxAbs) * 50;
              const barColor = positive ? COLORS.amber : COLORS.teal;
              return (
                <li
                  key={it.id ?? i}
                  className="grid grid-cols-[7rem_1fr_3.4rem_3.4rem] items-center gap-2"
                >
                  <span
                    className="text-xs text-stone-600 truncate"
                    title={`${pickText(locale, it.label)} · ${fmtMonthLoc(it.period, locale)}`}
                  >
                    {pickText(locale, it.label)}
                  </span>
                  <span className="relative block h-2.5 rounded-sm bg-stone-100">
                    <span className="absolute inset-y-0 left-1/2 w-px bg-stone-300" aria-hidden />
                    <span
                      className="absolute inset-y-0 rounded-sm"
                      style={{
                        backgroundColor: barColor,
                        opacity: 0.8,
                        left: positive ? '50%' : `${50 - width}%`,
                        width: `${width}%`,
                      }}
                    />
                  </span>
                  <span
                    className="text-xs font-semibold tabular-nums text-right"
                    style={{ color: barColor }}
                  >
                    {fmtSignedPctLoc(v, locale, 1)}
                  </span>
                  <span className="text-xs tabular-nums text-right text-stone-500">
                    {fmtSignedPctLoc(it.cumulative_5y_pct, locale, 1)}
                  </span>
                </li>
              );
            })}
          </ul>
          {items[0]?.period && (
            <p className="mt-1.5 text-[10px] text-stone-400">
              {t('foodItemsPeriod', { month: fmtMonthLoc(items[0].period, locale) })}
            </p>
          )}
        </div>
      )}

      {/* 5-year cumulative comparison (our arithmetic on official rates) */}
      {cum?.rows && cum.rows.length > 0 && (
        <div className="mt-4 border-t border-stone-100 pt-3">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
              {t('foodCumTitle', { years: cum.window_years ?? 5 })}
            </span>
            {cum.badge && (
              <StatusBadge
                kind={storyBadgeKind(cum.badge.kind)}
                label={pickText(locale, cum.badge.label) ?? t('badgeOfficialCalc')}
                title={t('badgeOfficialCalcDef')}
              />
            )}
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm tabular-nums">
            {cum.rows.map((r, i) => (
              <span key={r.id ?? i} title={r.window}>
                <span className="text-xs text-stone-500">{pickText(locale, r.label)}</span>{' '}
                <span className="font-bold text-stone-800">
                  {fmtSignedPctLoc(r.cumulative_pct, locale, 1)}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </StoryCard>
  );
}
