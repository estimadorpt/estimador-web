// Labour-market tile — a state READ-OUT of published labour data, explicitly
// NOT a forecast (next-month unemployment is at its noise floor; the payload
// honesty_note says so and is rendered verbatim). The verdict is a fixed sign
// rule on published 3-month changes — also stated verbatim (verdict_rule).
//
// Each datum carries its own "as of {date}" badge (labour series arrive with
// very different lags — the IEFP registered count can trail the LFS rate by
// months). When the producer flags a leg as stale (`stale` / `age_days`), the
// badge turns amber so nobody reads an old print as current.
//
// Sign colouring follows labour-market semantics: RISING unemployment (UR pp
// or IEFP persons) is adverse (red); falling is favourable (teal). Employment
// expectations are a survey balance (positive = teal).

import { getTranslations } from 'next-intl/server';
import { TileCard } from './TileCard';
import { StatusBadge } from './StatusBadge';
import {
  COLORS,
  fmtPctValue,
  fmtSignedPpValue,
  fmtSignedInt,
  fmtSignedNum,
  fmtDate,
} from '@/lib/utils/economy-format';
import { labelKey, pickNote } from '@/lib/i18n/economy-labels';
import type { LabourTileData } from '@/types/economy-dashboard';

function isNum(v: number | null | undefined): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

// adverse (rising unemployment) → red; favourable (falling) → teal; flat → stone
function unemploymentChangeColor(v: number | null | undefined): string {
  if (!isNum(v) || v === 0) return COLORS.stoneDark;
  return v > 0 ? COLORS.red : COLORS.teal;
}

const VERDICT_KEYS: Record<string, string> = {
  improving: 'labourVerdictImproving',
  stable: 'labourVerdictStable',
  deteriorating: 'labourVerdictDeteriorating',
};

// Per-datum provenance badge: "as of {date}", amber when the producer flags the
// leg as stale (or reports an age above ~2 months without a flag).
function AsOfBadge({
  date,
  ageDays,
  stale,
  locale,
  asOfLabel,
  staleTitle,
}: {
  date?: string;
  ageDays?: number;
  stale?: boolean;
  locale: string;
  asOfLabel: string;
  staleTitle?: string;
}) {
  if (!date) return null;
  const isStale = stale === true || (stale === undefined && isNum(ageDays) && ageDays > 75);
  return (
    <span
      title={isStale ? staleTitle : undefined}
      className={`inline-block text-[10px] px-1.5 py-0.5 rounded tabular-nums ${
        isStale
          ? 'bg-amber-100 text-amber-800 font-semibold'
          : 'bg-stone-100 text-stone-500'
      }`}
    >
      {asOfLabel} {fmtDate(date, locale)}
      {isNum(ageDays) ? ` · ${Math.round(ageDays)}d` : ''}
    </span>
  );
}

export async function LabourTile({
  data,
  locale,
}: {
  data: LabourTileData;
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: 'economics' });
  const lblKey = labelKey(data?.label);

  const ur = data?.unemployment_rate;
  const iefp = data?.iefp_registered_unemployment;
  const emp = data?.employment_expectations;

  const verdict = (data?.verdict ?? '').toLowerCase();
  const verdictKey = VERDICT_KEYS[verdict];
  const verdictWord = verdictKey ? t(verdictKey) : data?.verdict ?? '—';
  const verdictClasses =
    verdict === 'improving'
      ? 'bg-emerald-100 text-emerald-800'
      : verdict === 'deteriorating'
        ? 'bg-red-100 text-red-800'
        : 'bg-stone-100 text-stone-600';

  // Honesty: payload note (bilingual when shipped) + the fixed verdict rule, verbatim.
  const honesty = [
    pickNote(locale, data?.honesty_note_i18n, data?.honesty_note, data?.honesty_note_pt),
    data?.verdict_rule,
  ]
    .filter(Boolean)
    .join(' — ');

  return (
    <TileCard
      title={t('labourTitle')}
      eyebrow={t('labourEyebrow')}
      label={lblKey ? t(lblKey) : data?.label}
      labelTone="neutral"
      honesty={honesty || undefined}
    >
      {/* headline: UR level + verdict chip */}
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-4xl md:text-5xl font-black tabular-nums tracking-tighter leading-none text-stone-900">
          {fmtPctValue(ur?.level_pct, 1)}
        </span>
        <span className="text-sm text-stone-500">{t('labourUrLabel')}</span>
        <StatusBadge kind="reading" label={t('badgeReading')} title={t('badgeReadingDef')} />
        <span
          className={`inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 ${verdictClasses}`}
        >
          {verdictWord}
        </span>
        <AsOfBadge
          date={ur?.level_date}
          ageDays={ur?.age_days}
          stale={ur?.stale}
          locale={locale}
          asOfLabel={t('asOf')}
          staleTitle={t('labourStaleTitle')}
        />
      </div>

      {/* the no-forecast honesty line — always visible, not only collapsed */}
      <p className="mt-1.5 text-xs leading-relaxed text-stone-500 max-w-prose">
        {t('labourNoForecast')}
      </p>

      {/* 3m changes + expectations — divider grid, no cards */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-px bg-stone-200 border border-stone-200">
        <div className="bg-white p-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
            {t('labourUr3m')}
          </div>
          <div
            className="text-2xl font-black tabular-nums mt-0.5"
            style={{ color: unemploymentChangeColor(ur?.change_3m_pp) }}
          >
            {fmtSignedPpValue(ur?.change_3m_pp, 1, locale)}
          </div>
          <div className="mt-1">
            <AsOfBadge
              date={ur?.change_as_of}
              ageDays={ur?.age_days}
              stale={ur?.stale}
              locale={locale}
              asOfLabel={t('asOf')}
              staleTitle={t('labourStaleTitle')}
            />
          </div>
        </div>

        <div className="bg-white p-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
            {t('labourIefp3m')}
          </div>
          <div
            className="text-2xl font-black tabular-nums mt-0.5"
            style={{ color: unemploymentChangeColor(iefp?.change_3m_persons) }}
          >
            {fmtSignedInt(iefp?.change_3m_persons, locale)}
          </div>
          <div className="text-[10px] text-stone-400 mt-0.5">{t('labourPersons')}</div>
          <div className="mt-1">
            <AsOfBadge
              date={iefp?.change_as_of}
              ageDays={iefp?.age_days}
              stale={iefp?.stale}
              locale={locale}
              asOfLabel={t('asOf')}
              staleTitle={t('labourStaleTitle')}
            />
          </div>
        </div>

        <div className="bg-white p-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
            {t('labourEmpExp')}
          </div>
          <div
            className="text-2xl font-black tabular-nums mt-0.5"
            style={{
              color: isNum(emp?.value)
                ? (emp.value as number) >= 0
                  ? COLORS.teal
                  : COLORS.amber
                : COLORS.stoneDark,
            }}
          >
            {fmtSignedNum(emp?.value, 1)}
          </div>
          <div className="text-[10px] text-stone-400 mt-0.5">{t('labourEmpExpUnits')}</div>
          <div className="mt-1">
            <AsOfBadge
              date={emp?.date}
              ageDays={emp?.age_days}
              stale={emp?.stale}
              locale={locale}
              asOfLabel={t('asOf')}
              staleTitle={t('labourStaleTitle')}
            />
          </div>
        </div>
      </div>
    </TileCard>
  );
}
