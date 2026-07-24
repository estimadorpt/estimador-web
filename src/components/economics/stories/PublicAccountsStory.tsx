// Public-accounts story: State budget execution (DGO via BdP) on a CASH basis
// — rolling 12-month tax receipts, nominal and HICP-deflated real growth — plus
// the Maastricht debt LEVEL with a 24-month sparkline. The debt/GDP ratio is
// deliberately NOT computed (no nominal-GDP source collected); the payload's
// bilingual ratio_note says so and is rendered verbatim.

import { getTranslations } from 'next-intl/server';
import { StoryCard } from './StoryCard';
import { COLORS } from '@/lib/utils/economy-format';
import {
  fmtIntLoc,
  fmtSignedPctLoc,
  fmtMonthLoc,
  meurToBn,
} from '@/lib/utils/story-format';
import { pickText, type PublicAccountsModule } from '@/types/economy-stories';

function isNum(v: number | null | undefined): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

const TAX_ORDER = ['vat_monthly', 'irs_monthly', 'irc_monthly', 'isp_monthly'];

function DebtSparkline({
  path,
  ariaLabel,
}: {
  path: Array<{ month?: string; value_meur?: number }>;
  ariaLabel: string;
}) {
  const pts = path.filter((p) => isNum(p.value_meur));
  if (pts.length < 2) return null;
  const W = 300;
  const H = 64;
  const padX = 4;
  const padY = 8;
  const values = pts.map((p) => p.value_meur as number);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = Math.max(hi - lo, 1);
  const xAt = (i: number) => padX + ((W - padX * 2) * i) / (pts.length - 1);
  const yAt = (v: number) => padY + (H - padY * 2) * (1 - (v - lo) / span);
  const line = pts
    .map((p, i) => `${xAt(i).toFixed(1)},${yAt(p.value_meur as number).toFixed(1)}`)
    .join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel} className="block w-full h-auto max-w-[320px]">
      <polyline
        points={line}
        fill="none"
        stroke={COLORS.stoneDark}
        strokeWidth={1.6}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle
        cx={xAt(pts.length - 1)}
        cy={yAt(pts[pts.length - 1].value_meur as number)}
        r={2.6}
        fill={COLORS.stoneDark}
      />
    </svg>
  );
}

export async function PublicAccountsStory({
  data,
  locale,
}: {
  data: PublicAccountsModule;
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: 'economics' });
  const taxes = TAX_ORDER.map((k) => data?.taxes_rolling_12m?.[k]).filter(Boolean);
  const debt = data?.debt;

  return (
    <StoryCard
      title={data?.title}
      badge={data?.badge}
      asOf={data?.as_of}
      headline={data?.headline}
      honesty={pickText(locale, data?.honesty_note_i18n)}
      locale={locale}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* rolling-12m tax receipts, nominal + real */}
        {taxes.length > 0 && (
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-2">
              {t('paTaxesTitle', {
                month: fmtMonthLoc(taxes[0]?.period, locale),
              })}
            </h4>
            <div className="grid grid-cols-[4rem_1fr_4.2rem_4.2rem] items-center gap-x-2 gap-y-0 mb-1 text-[9px] font-bold uppercase tracking-wider text-stone-400">
              <span />
              <span className="text-right">M€ (12m)</span>
              <span className="text-right">{t('paNominal')}</span>
              <span className="text-right">{t('paReal')}</span>
            </div>
            <ul className="divide-y divide-stone-100">
              {taxes.map((tax, i) => {
                const real = tax?.rolling_12m_real_growth_pct;
                return (
                  <li
                    key={i}
                    className="grid grid-cols-[4rem_1fr_4.2rem_4.2rem] items-center gap-x-2 py-1.5 text-xs tabular-nums"
                  >
                    <span className="font-semibold text-stone-700">
                      {pickText(locale, tax?.label)}
                    </span>
                    <span className="text-right text-stone-600">
                      {fmtIntLoc(tax?.rolling_12m_sum_meur, locale)}
                    </span>
                    <span className="text-right text-stone-500">
                      {fmtSignedPctLoc(tax?.rolling_12m_nominal_growth_pct, locale, 1)}
                    </span>
                    <span
                      className="text-right font-semibold"
                      style={{
                        color: isNum(real)
                          ? real >= 0
                            ? COLORS.teal
                            : COLORS.red
                          : COLORS.stoneDark,
                      }}
                    >
                      {fmtSignedPctLoc(real, locale, 1)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Maastricht debt level + 24m path */}
        {debt && (
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-2">
              {t('paDebtTitle', { month: fmtMonthLoc(debt.period, locale) })}
            </h4>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-3xl font-black tabular-nums tracking-tight text-stone-900">
                {meurToBn(debt.level_meur, locale, 1)}
              </span>
              <span className="text-xs text-stone-500">{t('paBnEur')}</span>
              {isNum(debt.change_12m_meur) && (
                <span className="text-xs tabular-nums text-stone-500">
                  {t('pa12m')}: {debt.change_12m_meur >= 0 ? '+' : '−'}
                  {fmtIntLoc(Math.abs(debt.change_12m_meur), locale)} M€ (
                  {fmtSignedPctLoc(debt.change_12m_pct, locale, 1)})
                </span>
              )}
            </div>
            {Array.isArray(debt.path_last_24m) && (
              <div className="mt-2">
                <DebtSparkline path={debt.path_last_24m} ariaLabel={t('paDebtAria')} />
              </div>
            )}
            {pickText(locale, debt.ratio_note) && (
              <p className="mt-2 text-[10px] leading-snug text-stone-400 max-w-prose">
                {pickText(locale, debt.ratio_note)}
              </p>
            )}
          </div>
        )}
      </div>
    </StoryCard>
  );
}
