// Track-record tile — two-era ledger, deliberately plain (honest, no over-design).
//
// Era 1 "Backtest": as-if calls from the leak-free publication-lag harness,
// scored against the GDP number as FIRST published. Summary stats per horizon
// (n, rel-RMSE vs AR(1) on first-release and on the revised series, ex-COVID
// primary). Era 2 "Live": every call actually published since 2026-06-04 —
// sparse by construction, no scored outturn yet; listed verbatim.
//
// The payload `framing` string and the era labels are rendered VERBATIM — they
// are the producer's own honest description of what these numbers are.

import { getTranslations } from 'next-intl/server';
import { TileCard } from './TileCard';
import { StatusBadge } from './StatusBadge';
import { fmtSignedPct, fmtNum, fmtDate } from '@/lib/utils/economy-format';
import { labelKey, pickNote, pickOwnLanguage } from '@/lib/i18n/economy-labels';
import { ProducerNote } from './ProducerNote';
import type { TrackRecordTileData } from '@/types/economy-dashboard';

function isNum(v: number | null | undefined): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

const HORIZON_ORDER = ['M1', 'M2', 'M3'];

export async function TrackRecordTile({
  data,
  locale,
}: {
  data: TrackRecordTileData;
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: 'economics' });
  const lblKey = labelKey(data?.label);

  const backtest = data?.eras?.backtest;
  const live = data?.eras?.live;
  const summary = backtest?.summary ?? {};
  const horizons = HORIZON_ORDER.filter((h) => summary[h]).concat(
    Object.keys(summary).filter((h) => !HORIZON_ORDER.includes(h))
  );
  const liveRows = Array.isArray(live?.rows) ? live.rows : [];

  return (
    <TileCard
      title={t('trackTitle')}
      eyebrow={t('trackEyebrow')}
      label={lblKey ? t(lblKey) : data?.label}
      labelTone="neutral"
      honesty={pickNote(locale, data?.honesty_note_i18n, data?.honesty_note, data?.honesty_note_pt)}
    >
      <div className="mb-2">
        <StatusBadge
          kind="officialCalls"
          label={t('badgeOfficialCalls')}
          title={t('badgeOfficialCallsDef')}
        />
      </div>

      {/* the producer's verbatim two-era framing — the key honesty line */}
      <ProducerNote locale={locale} text={data?.framing} i18n={data?.framing_i18n} tone="body" />

      {/* ---- era 1: backtest ---------------------------------------------------- */}
      <div className="mt-5">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-stone-600">
          {t('trackBacktestTitle')}
        </h3>
        {(() => {
          const label = pickOwnLanguage(locale, backtest?.label_i18n, backtest?.label);
          return label ? <p className="text-[11px] text-stone-400 mt-0.5">{label}</p> : null;
        })()}

        {horizons.length > 0 && (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-stone-300 text-left">
                  <th className="py-1.5 pr-3 text-[11px] font-bold uppercase tracking-wider text-stone-500">
                    {t('trackHorizon')}
                  </th>
                  <th className="py-1.5 pr-3 text-[11px] font-bold uppercase tracking-wider text-stone-500 text-right">
                    {t('trackN')}
                  </th>
                  <th className="py-1.5 pr-3 text-[11px] font-bold uppercase tracking-wider text-stone-500 text-right">
                    {t('trackRelFirst')}
                  </th>
                  <th className="py-1.5 pr-3 text-[11px] font-bold uppercase tracking-wider text-stone-500 text-right">
                    {t('trackRelRevised')}
                  </th>
                  <th className="py-1.5 text-[11px] font-bold uppercase tracking-wider text-stone-500 text-right">
                    {t('trackHit80')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {horizons.map((h) => {
                  const s = summary[h];
                  const ex = s?.excl_covid;
                  return (
                    <tr key={h} className="border-b border-stone-200">
                      <td className="py-1.5 pr-3 font-semibold text-stone-800">{h}</td>
                      <td className="py-1.5 pr-3 text-right tabular-nums text-stone-600">
                        {isNum(ex?.n_scored) ? ex!.n_scored : '—'}
                      </td>
                      <td className="py-1.5 pr-3 text-right tabular-nums font-semibold text-stone-800">
                        {fmtNum(ex?.rel_vs_ar1_first_release)}
                      </td>
                      <td className="py-1.5 pr-3 text-right tabular-nums text-stone-600">
                        {fmtNum(ex?.rel_vs_ar1_latest)}
                      </td>
                      <td className="py-1.5 text-right tabular-nums text-stone-600">
                        {isNum(ex?.band_hit_rate_80)
                          ? `${Math.round((ex!.band_hit_rate_80 as number) * 100)}%`
                          : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="mt-1.5 text-[11px] text-stone-400 max-w-prose">
              {t('trackTableNote')}
            </p>
          </div>
        )}

        {/* selection caveat for the backtest-era numbers (the M2 combo was the
            best of ~19 pre-registered candidates) — verbatim when the producer
            ships it, bilingual when available. */}
        <ProducerNote locale={locale} text={backtest?.selection_caveat} i18n={backtest?.selection_caveat_i18n} tone="caveat" className="mt-2" />

        {/* model naming reflects the 2026-06-11 M2 promotion — older rows keep
            their pre-promotion label (supply_side_bridge at M2). */}
        <p className="mt-2 text-[11px] leading-snug text-stone-400 max-w-prose">
          {t('trackModelNamingNote')}
        </p>

        {/* the producer's own methodological notes, verbatim */}
        <ProducerNote locale={locale} text={backtest?.notes} className="mt-2" />
      </div>

      {/* ---- era 2: live --------------------------------------------------------- */}
      <div className="mt-5 border-t border-stone-100 pt-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-stone-600">
          {t('trackLiveTitle')}
        </h3>
        {(() => {
          const label = pickOwnLanguage(locale, live?.label_i18n, live?.label);
          return label ? <p className="text-[11px] text-stone-400 mt-0.5">{label}</p> : null;
        })()}

        {liveRows.length > 0 ? (
          <ul className="mt-2.5 space-y-1.5">
            {liveRows.map((r, i) => (
              <li
                key={`lr-${i}`}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-xs text-stone-600 tabular-nums"
              >
                <span className="text-stone-400 w-24 shrink-0">{fmtDate(r?.date, locale)}</span>
                <span className="font-medium text-stone-700">
                  {r?.target_quarter ?? '—'} · {r?.position ?? '—'}
                </span>
                <span className="text-stone-400">{r?.model ?? '—'}</span>
                <span className="font-semibold text-stone-800">
                  {fmtSignedPct(r?.our_call, 2)}
                </span>
                {Array.isArray(r?.ci_80) && (
                  <span className="text-stone-400">
                    [{fmtSignedPct(r.ci_80[0], 2)} … {fmtSignedPct(r.ci_80[1], 2)}]
                  </span>
                )}
                <span className="text-stone-400">
                  {isNum(r?.outturn) ? fmtSignedPct(r.outturn, 2) : t('trackNoOutturn')}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          // Emptiness as integrity: no live quarter has been scored yet — say
          // so plainly instead of leaving a bare dash.
          <p className="mt-2 text-xs text-stone-500">{t('trackLiveEmpty')}</p>
        )}

        {/* "every dot is a call we actually published" — honest only while it
            stays paired with the fact that nothing has been scored yet. */}
        {liveRows.length > 0 && !liveRows.some((r) => isNum(r?.outturn)) && (
          <p className="mt-1.5 text-[11px] leading-snug text-stone-400 max-w-prose">
            {t('trackLivePending')}
          </p>
        )}

        {/* the live-era summary note, verbatim */}
        <ProducerNote locale={locale} text={live?.summary?.note} className="mt-2" />
      </div>
    </TileCard>
  );
}
