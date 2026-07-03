// Inflation tile — PR-1 gated (pre-registered publication rule, frozen
// 2026-07-02 BEFORE any evaluation; docs/experiment-log.md in
// estimador-economics).
//
// TRACKER branch (the live 2026-07-03 verdict): this tile republishes the
// latest OFFICIAL HICP prints (INE/Eurostat) and states, always visibly, that
// our pre-registered model did NOT clear its own publication gate — that
// honest sentence IS the product. NO model number appears anywhere in this
// branch. The only forward-looking context allowed is the labelled
// seasonal-carry reference (official arithmetic, explicitly NOT a model
// estimate, NOT a forecast).
//
// MODEL branch (dormant, fully wired): if a future re-evaluation flips the
// gate to SHIP_MODEL, the payload carries `model` (point m/m + implied y/y +
// split-conformal 80% band) published as an "estimativa indicativa da
// inflação" — never as a forecast, never under INE's official
// flash-publication name — plus the scored-vs-flash ledger and the
// pre-committed demotion rule (6 consecutive scored months worse than the
// seasonal AR remove the number).
//
// HARD NAMING RULES (from the payload, load-bearing): no number on this tile
// is ever called a forecast; the UI copy never uses INE's flash-publication
// name. Payload honesty strings are rendered verbatim via pickNote.

import { getTranslations } from 'next-intl/server';
import { TileCard } from './TileCard';
import { LabelBadge } from './LabelBadge';
import { StatusBadge } from './StatusBadge';
import { labelKey, pickNote } from '@/lib/i18n/economy-labels';
import type { InflationTileData } from '@/types/economy-dashboard';
import {
  fmtPctLoc,
  fmtSignedPpLoc,
  fmtMonthLoc,
  fmtPeriodLoc,
} from '@/lib/utils/story-format';

function isNum(v: number | null | undefined): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function pickI18n(
  locale: string,
  obj?: { en?: string; pt?: string }
): string | undefined {
  if (!obj) return undefined;
  return locale === 'pt' ? obj.pt ?? obj.en : obj.en ?? obj.pt;
}

export async function InflationTile({
  data,
  locale,
}: {
  data: InflationTileData;
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: 'economics' });
  const lblKey = labelKey(data?.label);

  const official = data?.official;
  const officialOk = !!official && official.status !== 'unavailable';
  const isModelMode = data?.mode === 'model' && !!data?.model;
  const carry = data?.seasonal_carry_reference;
  const ledger = data?.scored_vs_flash;

  // Collapsible = payload honesty note (verbatim) + the pre-committed tracking
  // rule + the hard naming rules, all producer-supplied and bilingual.
  const honesty = [
    pickNote(locale, data?.honesty_note_i18n, data?.honesty_note, data?.honesty_note_pt),
    pickI18n(locale, data?.tracking_rule),
    pickI18n(locale, data?.naming_rules),
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <TileCard
      title={t('inflationTitle')}
      eyebrow={t('inflationEyebrow')}
      label={lblKey ? t(lblKey) : data?.label}
      labelTone={isModelMode ? 'amber' : 'neutral'}
      honesty={honesty || undefined}
    >
      {/* ---- MODEL branch headline (dormant; gate must say SHIP_MODEL) ------ */}
      {isModelMode && (
        <div className="mb-5">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            {/* producer's own name for the number, verbatim — never INE's name */}
            <span className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
              {data.model?.name ?? 'estimativa indicativa da inflação'}
            </span>
            <span className="text-3xl md:text-4xl font-black tabular-nums tracking-tight text-stone-900">
              {fmtSignedPpLoc(data.model?.point_mm_pp, locale, 2)}
            </span>
            <span className="text-xs text-stone-400">
              {t('inflationMm')} · {fmtMonthLoc(data.model?.target_month, locale)}
            </span>
            <StatusBadge
              kind="indicative"
              label={t('badgeIndicative')}
              title={t('badgeIndicativeDef')}
            />
          </div>
          {isNum(data.model?.implied_yoy_pct) && (
            <p className="mt-1 text-sm text-stone-600 tabular-nums">
              {t('inflationImpliedYoy')}:{' '}
              <span className="font-bold">{fmtPctLoc(data.model?.implied_yoy_pct, locale, 1)}</span>{' '}
              {t('yoy')}
            </p>
          )}
          {Array.isArray(data.model?.band80_mm_pp) && (
            <p className="mt-1 text-xs text-stone-500 tabular-nums">
              {t('officialBand80')}: {fmtSignedPpLoc(data.model?.band80_mm_pp?.[0], locale, 2)} …{' '}
              {fmtSignedPpLoc(data.model?.band80_mm_pp?.[1], locale, 2)}
            </p>
          )}
          <p className="mt-1 text-[11px] text-stone-400">
            {t('inflationCheckpoint', {
              name: data.model?.checkpoint?.name ?? '—',
              day: data.model?.checkpoint?.frozen_at_day ?? '—',
            })}
            {data.model?.band_note ? ` · ${data.model.band_note}` : ''}
          </p>
          {/* scored-vs-flash ledger (fills as INE flashes land) */}
          <div className="mt-3 border-t border-stone-100 pt-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-stone-600 mb-1">
              {t('inflationLedgerTitle')}
            </h3>
            {ledger?.rows && ledger.rows.length > 0 ? (
              <ul className="text-xs text-stone-600 space-y-0.5 tabular-nums">
                {ledger.rows.map((r, i) => (
                  <li key={r.month ?? i}>
                    {fmtMonthLoc(r.month, locale)}: {fmtSignedPpLoc(r.model_mm_pp, locale, 2)}{' '}
                    vs {fmtSignedPpLoc(r.flash_mm_pp, locale, 2)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[11px] text-stone-400">{t('inflationLedgerEmpty')}</p>
            )}
          </div>
        </div>
      )}

      {/* ---- OFFICIAL data (headline in tracker mode; context in model mode) - */}
      {officialOk && (
        <div>
          {isModelMode && (
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-stone-600 mb-1.5">
              {t('inflationOfficialBlockTitle')}
            </h3>
          )}
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span
              className={`font-black tabular-nums tracking-tighter leading-none text-stone-900 ${
                isModelMode ? 'text-2xl md:text-3xl' : 'text-4xl md:text-5xl'
              }`}
            >
              {fmtPctLoc(official?.headline_yoy_pct, locale, 1)}
            </span>
            <span className="text-sm text-stone-500">
              {t('yoy')} · {fmtMonthLoc(official?.month, locale)}
            </span>
            <StatusBadge
              kind="official"
              label={t('badgeOfficial')}
              title={t('badgeOfficialDef')}
            />
            {official?.provisional && (
              <LabelBadge tone="amber" title={official?.provisional_note}>
                {t('inflationProvisional')}
              </LabelBadge>
            )}
          </div>

          {/* The honest gate sentence — ALWAYS visible in tracker mode. */}
          {!isModelMode && (
            <p className="mt-1.5 text-xs leading-relaxed text-stone-500 max-w-prose">
              {t('inflationGateLine')}
            </p>
          )}
          {data?.model_unavailable_reason && (
            <p className="mt-1 text-[11px] text-stone-400 max-w-prose">
              {t('inflationModelUnavailable')} ({data.model_unavailable_reason})
            </p>
          )}

          {/* component grid: core / energy / food / m-m */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-px bg-stone-200 border border-stone-200">
            <div className="bg-white p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                {t('inflationCore')}
              </div>
              <div className="text-xl font-black tabular-nums mt-0.5 text-stone-800">
                {fmtPctLoc(official?.core_yoy_pct, locale, 1)}
              </div>
            </div>
            <div className="bg-white p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                {t('inflationEnergy')}
              </div>
              <div className="text-xl font-black tabular-nums mt-0.5 text-stone-800">
                {fmtPctLoc(official?.energy_yoy_pct, locale, 1)}
              </div>
            </div>
            <div className="bg-white p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                {t('inflationFood')}
              </div>
              <div className="text-xl font-black tabular-nums mt-0.5 text-stone-800">
                {fmtPctLoc(official?.food_yoy_pct, locale, 1)}
              </div>
            </div>
            <div className="bg-white p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                {t('inflationMm')}
              </div>
              <div className="text-xl font-black tabular-nums mt-0.5 text-stone-800">
                {fmtSignedPpLoc(official?.mm_pp, locale, 2)}
              </div>
              {/* compound badge string from the producer, verbatim */}
              {official?.mm_badge && (
                <div className="text-[9px] text-stone-400 mt-0.5">{official.mm_badge}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {!officialOk && !isModelMode && (
        <p className="text-sm text-stone-500">{t('unavailable')}</p>
      )}

      {/* ---- seasonal-carry reference (tracker mode only; labelled, NOT a
              model estimate, NOT an 'estimativa indicativa', NOT a forecast) -- */}
      {carry && isNum(carry.mm_pp_same_month_mean) && (
        <div className="mt-4 rounded border border-stone-200 bg-stone-50 p-3 max-w-xl">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
              {pickI18n(locale, carry.label_i18n) ?? t('inflationCarryTitle')}
            </span>
            {/* compound badge string from the producer, verbatim */}
            {carry.badge && (
              <span className="text-[9px] text-stone-400">{carry.badge}</span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1 tabular-nums">
            <span className="text-lg font-bold text-stone-700">
              {fmtSignedPpLoc(carry.mm_pp_same_month_mean, locale, 2)}
            </span>
            <span className="text-xs text-stone-500">
              {t('inflationMm')} · {fmtMonthLoc(carry.reference_month, locale)}
            </span>
            {isNum(carry.implied_yoy_pct) && (
              <span className="text-xs text-stone-500">
                {t('inflationImpliedYoy')}: {fmtPctLoc(carry.implied_yoy_pct, locale, 1)}
              </span>
            )}
          </div>
          {/* the "NOT a model estimate / NOT a forecast" note, verbatim */}
          {pickI18n(locale, carry.note_i18n) && (
            <p className="mt-1.5 text-[11px] leading-relaxed text-stone-500">
              {pickI18n(locale, carry.note_i18n)}
            </p>
          )}
        </div>
      )}

      {/* ---- next official release + pre-committed tracking rule ------------- */}
      <div className="mt-4 space-y-1">
        {data?.next_flash?.expected_date && (
          <p className="text-[11px] text-stone-400">
            {t('inflationNextFlash', {
              month: fmtMonthLoc(data.next_flash.reference_month, locale),
            })}
            : {fmtPeriodLoc(data.next_flash.expected_date, locale)}
          </p>
        )}
        {pickI18n(locale, data?.tracking_rule) && (
          <p className="text-[10px] leading-snug text-stone-400 max-w-prose">
            {pickI18n(locale, data.tracking_rule)}
          </p>
        )}
      </div>
    </TileCard>
  );
}
