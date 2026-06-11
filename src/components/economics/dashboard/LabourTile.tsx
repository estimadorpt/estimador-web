// Labour-market tile — a state READ-OUT of published labour data, explicitly
// NOT a forecast (next-month unemployment is at its noise floor; the payload
// honesty_note says so and is rendered verbatim). The verdict is a fixed sign
// rule on published 3-month changes — also stated verbatim (verdict_rule).
//
// Sign colouring follows labour-market semantics: RISING unemployment (UR pp
// or IEFP persons) is adverse (red); falling is favourable (teal). Employment
// expectations are a survey balance (positive = teal).

import { getTranslations } from 'next-intl/server';
import { TileCard } from './TileCard';
import {
  COLORS,
  fmtPctValue,
  fmtSignedPpValue,
  fmtSignedInt,
  fmtSignedNum,
  fmtDate,
} from '@/lib/utils/economy-format';
import { labelKey } from '@/lib/i18n/economy-labels';
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

  // Honesty: payload note verbatim + the fixed verdict rule, verbatim.
  const honesty = [data?.honesty_note, data?.verdict_rule]
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
        <span className="text-sm text-stone-500">
          {t('labourUrLabel')}
          {ur?.level_date ? ` · ${fmtDate(ur.level_date, locale)}` : ''}
        </span>
        <span
          className={`inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 ${verdictClasses}`}
        >
          {verdictWord}
        </span>
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
          <div className="text-[10px] text-stone-400 mt-0.5">
            {ur?.change_as_of ? fmtDate(ur.change_as_of, locale) : '—'}
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
          <div className="text-[10px] text-stone-400 mt-0.5">
            {t('labourPersons')}
            {iefp?.change_as_of ? ` · ${fmtDate(iefp.change_as_of, locale)}` : ''}
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
          <div className="text-[10px] text-stone-400 mt-0.5">
            {t('labourEmpExpUnits')}
            {emp?.date ? ` · ${fmtDate(emp.date, locale)}` : ''}
          </div>
        </div>
      </div>
    </TileCard>
  );
}
