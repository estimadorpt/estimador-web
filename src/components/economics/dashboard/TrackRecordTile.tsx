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
import { fmtSignedPct, fmtNum, fmtDate } from '@/lib/utils/economy-format';
import { labelKey } from '@/lib/i18n/economy-labels';
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
      honesty={data?.honesty_note ?? undefined}
    >
      {/* the producer's verbatim two-era framing — the key honesty line */}
      {data?.framing && (
        <p className="text-sm leading-relaxed text-stone-700 max-w-prose border-l-2 border-stone-300 pl-3">
          {data.framing}
        </p>
      )}

      {/* ---- era 1: backtest ---------------------------------------------------- */}
      <div className="mt-5">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-stone-600">
          {t('trackBacktestTitle')}
        </h3>
        {backtest?.label && (
          <p className="text-[11px] text-stone-400 mt-0.5">{backtest.label}</p>
        )}

        {horizons.length > 0 && (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-stone-300 text-left">
                  <th className="py-1.5 pr-3 text-[10px] font-bold uppercase tracking-wider text-stone-500">
                    {t('trackHorizon')}
                  </th>
                  <th className="py-1.5 pr-3 text-[10px] font-bold uppercase tracking-wider text-stone-500 text-right">
                    {t('trackN')}
                  </th>
                  <th className="py-1.5 pr-3 text-[10px] font-bold uppercase tracking-wider text-stone-500 text-right">
                    {t('trackRelFirst')}
                  </th>
                  <th className="py-1.5 pr-3 text-[10px] font-bold uppercase tracking-wider text-stone-500 text-right">
                    {t('trackRelRevised')}
                  </th>
                  <th className="py-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-500 text-right">
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
            <p className="mt-1.5 text-[10px] text-stone-400 max-w-prose">
              {t('trackTableNote')}
            </p>
          </div>
        )}

        {/* the producer's own methodological notes, verbatim */}
        {Array.isArray(backtest?.notes) && backtest.notes.length > 0 && (
          <ul className="mt-2 space-y-1">
            {backtest.notes.map((n, i) => (
              <li key={`bn-${i}`} className="text-[10px] leading-snug text-stone-400 max-w-prose">
                {n}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ---- era 2: live --------------------------------------------------------- */}
      <div className="mt-5 border-t border-stone-100 pt-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-stone-600">
          {t('trackLiveTitle')}
        </h3>
        {live?.label && (
          <p className="text-[11px] text-stone-400 mt-0.5">{live.label}</p>
        )}

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
          <p className="mt-2 text-xs text-stone-400">—</p>
        )}

        {/* the live-era summary note, verbatim */}
        {live?.summary?.note && (
          <p className="mt-2 text-[10px] leading-snug text-stone-400 max-w-prose">
            {live.summary.note}
          </p>
        )}
      </div>
    </TileCard>
  );
}
