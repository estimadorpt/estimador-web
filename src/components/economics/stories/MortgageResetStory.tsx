// Mortgage-reset story — the FLAGSHIP honesty demonstration. Two-part layout:
//
//   "Já decidido"    — resets this month use ALREADY-OBSERVED monthly-average
//                      Euribor fixings (ECB): pure arithmetic, badge
//                      "Dado oficial, cálculo nosso". Not a forecast.
//   "Ainda em aberto" — later resets whose index does not exist yet: scenarios
//                      at the current level and ±50bp, badge "Cenário".
//                      Explicitly NOT our forecast.
//
// All euro values come from the payload (standard loan: EUR 150k / 30y /
// 1.0pp spread); assumptions are published alongside. The payload notes and
// honesty_note_i18n (which includes "not financial advice") render verbatim.

import { getTranslations } from 'next-intl/server';
import { StoryCard } from './StoryCard';
import { StatusBadge, storyBadgeKind } from '../dashboard/StatusBadge';
import { COLORS } from '@/lib/utils/economy-format';
import {
  fmtNumLoc,
  fmtEurLoc,
  fmtSignedEurLoc,
  fmtSignedPctLoc,
  fmtMonthLoc,
  fmtPctLoc,
} from '@/lib/utils/story-format';
import {
  pickText,
  type MortgageResetModule,
  type MortgageDecidedTenor,
  type MortgageOpenTenor,
} from '@/types/economy-stories';

function isNum(v: number | null | undefined): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

// Rising instalment = adverse for the household (red); falling = teal.
function deltaColor(v: number | null | undefined): string {
  if (!isNum(v) || v === 0) return COLORS.stoneDark;
  return v > 0 ? COLORS.red : COLORS.teal;
}

const TENOR_ORDER = ['euribor_3m', 'euribor_6m', 'euribor_12m'];

function orderedTenors<T>(tenors?: Record<string, T>): Array<[string, T]> {
  if (!tenors) return [];
  const known = TENOR_ORDER.filter((k) => k in tenors).map(
    (k) => [k, tenors[k]] as [string, T]
  );
  const extras = Object.entries(tenors).filter(([k]) => !TENOR_ORDER.includes(k));
  return [...known, ...extras];
}

export async function MortgageResetStory({
  data,
  locale,
}: {
  data: MortgageResetModule;
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: 'economics' });

  const decided = data?.decided;
  const open = data?.open;
  const a = data?.assumptions;
  const ctx = data?.context;

  const decidedTenors = orderedTenors<MortgageDecidedTenor>(decided?.tenors);
  const openTenors = orderedTenors<MortgageOpenTenor>(open?.tenors);

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
        {/* ---------------- part 1: já decidido (observed fixings) ---------- */}
        {decided && decidedTenors.length > 0 && (
          <div className="rounded border border-stone-200 p-4">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
                {pickText(locale, decided.label) ?? '—'}
              </span>
              {decided.badge && (
                <StatusBadge
                  kind={storyBadgeKind(decided.badge.kind)}
                  label={pickText(locale, decided.badge.label) ?? t('badgeOfficialCalc')}
                  title={t('badgeOfficialCalcDef')}
                />
              )}
              {decided.reset_month && (
                <span className="text-[10px] text-stone-400">
                  {t('mortgageResetMonth')} {fmtMonthLoc(decided.reset_month, locale)}
                </span>
              )}
            </div>

            <ul className="divide-y divide-stone-100">
              {decidedTenors.map(([key, tn]) => (
                <li key={key} className="py-2.5 first:pt-0 last:pb-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-semibold text-stone-800">
                      {tn.label ?? key}
                    </span>
                    <span
                      className="text-lg font-black tabular-nums"
                      style={{ color: deltaColor(tn.delta_eur_month) }}
                    >
                      {fmtSignedEurLoc(tn.delta_eur_month, locale)}
                      <span className="text-[10px] font-semibold text-stone-400">
                        {' '}
                        /{t('mortgagePerMonth')}
                      </span>
                    </span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-stone-500 tabular-nums">
                    {fmtEurLoc(tn.instalment_old_eur, locale)} →{' '}
                    <span className="font-semibold text-stone-700">
                      {fmtEurLoc(tn.instalment_new_eur, locale)}
                    </span>
                    {isNum(tn.delta_pct) && (
                      <span> ({fmtSignedPctLoc(tn.delta_pct, locale, 1)})</span>
                    )}
                  </div>
                  <div className="mt-0.5 text-[10px] text-stone-400 tabular-nums">
                    {t('mortgageFixing')}: {fmtNumLoc(tn.fixing_old?.value_pct, locale, 3)}%{' '}
                    ({fmtMonthLoc(tn.fixing_old?.month, locale)}) →{' '}
                    {fmtNumLoc(tn.fixing_new?.value_pct, locale, 3)}%{' '}
                    ({fmtMonthLoc(tn.fixing_new?.month, locale)})
                  </div>
                </li>
              ))}
            </ul>

            {pickText(locale, decided.note) && (
              <p className="mt-3 text-[11px] leading-relaxed text-stone-500 border-t border-stone-100 pt-2">
                {pickText(locale, decided.note)}
              </p>
            )}
          </div>
        )}

        {/* ---------------- part 2: ainda em aberto (scenarios) -------------- */}
        {open && openTenors.length > 0 && (
          <div className="rounded border border-dashed border-stone-300 bg-stone-50/60 p-4">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-600">
                {pickText(locale, open.label) ?? '—'}
              </span>
              {open.badge && (
                <StatusBadge
                  kind={storyBadgeKind(open.badge.kind)}
                  label={pickText(locale, open.badge.label) ?? t('badgeScenario')}
                  title={t('badgeScenarioDef')}
                />
              )}
            </div>

            <ul className="divide-y divide-stone-200/70">
              {openTenors.map(([key, tn]) => {
                const s = tn.scenarios;
                return (
                  <li key={key} className="py-2.5 first:pt-0 last:pb-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-semibold text-stone-700">
                        {tn.label ?? key}
                      </span>
                      <span className="text-[10px] text-stone-400">
                        {t('mortgageNextReset')} {fmtMonthLoc(tn.next_reset_month, locale)}
                      </span>
                    </div>
                    <div className="mt-1.5 grid grid-cols-3 gap-1.5 text-center">
                      <div className="rounded bg-white border border-stone-200 px-1 py-1.5">
                        <div className="text-[9px] font-bold uppercase tracking-wider text-stone-400">
                          −50 {t('mortgageBp')}
                        </div>
                        <div
                          className="text-xs font-bold tabular-nums mt-0.5"
                          style={{ color: deltaColor(s?.down_50bp?.delta_vs_decided_eur) }}
                        >
                          {fmtSignedEurLoc(s?.down_50bp?.delta_vs_decided_eur, locale, 0)}
                        </div>
                      </div>
                      <div className="rounded bg-white border border-stone-200 px-1 py-1.5">
                        <div className="text-[9px] font-bold uppercase tracking-wider text-stone-400">
                          {t('mortgageFlat')}
                        </div>
                        <div className="text-xs font-bold tabular-nums mt-0.5 text-stone-600">
                          {fmtEurLoc(s?.flat?.instalment_eur, locale, 0)}
                        </div>
                      </div>
                      <div className="rounded bg-white border border-stone-200 px-1 py-1.5">
                        <div className="text-[9px] font-bold uppercase tracking-wider text-stone-400">
                          +50 {t('mortgageBp')}
                        </div>
                        <div
                          className="text-xs font-bold tabular-nums mt-0.5"
                          style={{ color: deltaColor(s?.up_50bp?.delta_vs_decided_eur) }}
                        >
                          {fmtSignedEurLoc(s?.up_50bp?.delta_vs_decided_eur, locale, 0)}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            {pickText(locale, open.note) && (
              <p className="mt-3 text-[11px] leading-relaxed text-stone-500 border-t border-stone-200/70 pt-2">
                {pickText(locale, open.note)}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ---------------- assumptions (published, not buried) ---------------- */}
      {a && (
        <p className="mt-4 text-[11px] leading-relaxed text-stone-500 max-w-prose">
          {t('mortgageAssumptions', {
            principal: fmtEurLoc(a.principal_eur, locale, 0),
            years: isNum(a.term_months) ? Math.round(a.term_months / 12) : 30,
            spread: fmtNumLoc(a.spread_pp, locale, 1),
          })}
        </p>
      )}

      {/* context: average new-loan rates + the stock's median instalment */}
      {ctx && isNum(ctx.new_loan_rate_variable_pct?.value) && (
        <p className="mt-1.5 text-[10px] text-stone-400 max-w-prose tabular-nums">
          {t('mortgageContext', {
            period: fmtMonthLoc(ctx.new_loan_rate_variable_pct?.period, locale),
            variable: fmtPctLoc(ctx.new_loan_rate_variable_pct?.value, locale, 2),
            mixed: fmtPctLoc(ctx.new_loan_rate_mixed_pct?.value, locale, 2),
            fixed: fmtPctLoc(ctx.new_loan_rate_fixed_pct?.value, locale, 2),
            median: fmtEurLoc(ctx.instalment_median_eur?.value, locale, 0),
          })}
        </p>
      )}
    </StoryCard>
  );
}
