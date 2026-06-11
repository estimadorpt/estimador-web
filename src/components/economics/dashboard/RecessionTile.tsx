// Recession tile: TWO clearly-separated dials — a CURRENT-state recession
// read-out (timely, calibrated; beats the base rate but NOT lag-1 persistence;
// rests on ~3 episodes) and a 2-QUARTER OUTLOOK (modest anticipation of gradual
// downturns; not significant; blind to sudden shocks). Each block carries its
// own audited honesty_note rendered verbatim via HonestyNote (this tile uses
// per-block notes, so TileCard gets NO outer honestyNote). A Sahm labour-market
// tripwire chip sits full-width below.
//
// Honesty affordances: tile `label` badge (TileCard), an always-visible inline
// caveat next to each headline number, and the verbatim collapsible notes.
// All fields are optional — every access is null-safe with "—" fallbacks.

import { getTranslations } from 'next-intl/server';
import { TileCard } from './TileCard';
import { Gauge } from './Gauge';
import { LabelBadge } from './LabelBadge';
import { HonestyNote } from './HonestyNote';
import { toneForLabel } from './LabelBadge';
import { fmtProbPct, fmtNum, COLORS } from '@/lib/utils/economy-format';
import { labelKey } from '@/lib/i18n/economy-labels';
import type { RecessionTileData, RecessionProbPoint } from '@/types/economy-dashboard';

// Past Portuguese recession spans (GFC, Troika, COVID). Matched to the history
// by quarter string -> index and shaded as light grey bands on the sparkline.
const RECESSION_SPANS: ReadonlyArray<readonly [string, string]> = [
  ['2008Q2', '2009Q1'],
  ['2010Q4', '2013Q1'],
  ['2020Q1', '2020Q2'],
];

// ---- recession-probability sparkline (inline, dependency-free) --------------
// x = index in history, y = p in 0..1. Light grey bands mark past recessions;
// the latest point is marked. Pure SVG so it scales on mobile via viewBox.
function ProbSparkline({
  history,
  color,
  bandsLabel,
  ariaLabel,
}: {
  history?: RecessionProbPoint[];
  color: string;
  bandsLabel: string;
  ariaLabel: string;
}) {
  const pts = (history ?? []).filter(
    (d) => d && typeof d.p === 'number' && Number.isFinite(d.p)
  );
  if (pts.length < 2) return null;

  const W = 320;
  const H = 96;
  const padX = 6;
  const padTop = 8;
  const padBottom = 14;
  const plotH = H - padTop - padBottom;
  const plotW = W - padX * 2;
  const n = pts.length;
  const xAt = (i: number) => padX + (plotW * i) / Math.max(n - 1, 1);
  // y axis is fixed 0..1 (probabilities) so band heights are honest.
  const yAt = (p: number) => padTop + plotH * (1 - Math.max(0, Math.min(1, p)));

  // Map a quarter string to its index in the history.
  const indexOf = (q: string): number => pts.findIndex((d) => d.quarter === q);

  // Resolve each recession span to a drawable [x0, x1] band where both ends are
  // present in the history (clamped to the visible range).
  const bands = RECESSION_SPANS.map(([from, to]) => {
    const iFrom = indexOf(from);
    const iTo = indexOf(to);
    if (iFrom < 0 && iTo < 0) return null;
    const lo = iFrom < 0 ? 0 : iFrom;
    const hi = iTo < 0 ? n - 1 : iTo;
    if (hi < lo) return null;
    return { x0: xAt(lo), x1: xAt(hi) };
  }).filter((b): b is { x0: number; x1: number } => b !== null);

  const line = pts.map((d, i) => `${xAt(i).toFixed(2)},${yAt(d.p).toFixed(2)}`).join(' ');
  const last = pts[n - 1];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={ariaLabel}
      className="block w-full h-auto"
    >
      {/* past-recession bands (light grey) */}
      {bands.map((b, i) => (
        <rect
          key={`band-${i}`}
          x={b.x0}
          y={padTop}
          width={Math.max(b.x1 - b.x0, 1.5)}
          height={plotH}
          fill={COLORS.stone}
          fillOpacity={0.18}
        />
      ))}
      {/* 0 and 1 reference lines */}
      <line x1={padX} x2={W - padX} y1={yAt(0)} y2={yAt(0)} stroke={COLORS.grid} strokeWidth={1} />
      <line x1={padX} x2={W - padX} y1={yAt(1)} y2={yAt(1)} stroke={COLORS.grid} strokeWidth={1} />
      {/* probability path */}
      <polyline points={line} fill="none" stroke={color} strokeWidth={1.75} strokeOpacity={0.9} />
      {/* latest point marker */}
      {typeof last?.p === 'number' && (
        <circle cx={xAt(n - 1)} cy={yAt(last.p)} r={3} fill={color} />
      )}
      {/* axis hints */}
      <text x={padX} y={yAt(1) - 2} fontSize="8" fill={COLORS.stone}>
        100%
      </text>
      <text x={padX} y={H - 3} fontSize="8" fill={COLORS.stone}>
        {pts[0]?.quarter ?? ''}
      </text>
      <text x={W - padX} y={H - 3} textAnchor="end" fontSize="8" fill={COLORS.stone}>
        {last?.quarter ?? ''}
      </text>
      {/* bands legend */}
      {bands.length > 0 && (
        <text x={W - padX} y={yAt(1) - 2} textAnchor="end" fontSize="8" fill={COLORS.stone}>
          {bandsLabel}
        </text>
      )}
    </svg>
  );
}

// Small neutral scorecard chip — a stat shown plainly, no alarm styling.
function ScoreChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-stone-200 px-2 py-1.5">
      <div className="text-[9px] font-semibold uppercase tracking-wide text-stone-400 leading-tight">
        {label}
      </div>
      <div className="text-sm font-bold tabular-nums leading-tight mt-0.5 text-stone-700">
        {value}
      </div>
    </div>
  );
}

const sgn = (v?: number) =>
  typeof v === 'number' && Number.isFinite(v) ? `${v >= 0 ? '+' : ''}${v.toFixed(2)}` : '—';

export async function RecessionTile({
  data,
  locale,
}: {
  data: RecessionTileData;
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: 'economics' });
  const lblKey = labelKey(data?.label);

  const current = data?.recession_probability;
  const leading = data?.leading_recession_probability;
  const sahm = data?.sahm_tripwire;
  const sc = current?.scorecard;

  const currentProb = current?.probability;
  const leadingProb = leading?.probability;

  const sahmTriggered = sahm?.triggered === true;

  return (
    <TileCard
      title={t('recessionTitle')}
      label={lblKey ? t(lblKey) : data?.label}
      labelTone={toneForLabel(data?.label)}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ---- A) CURRENT recession risk ---- */}
        <div className="md:border-r md:border-stone-100 md:pr-6">
          <h3 className="text-sm font-bold text-stone-900">{t('recessionCurrentTitle')}</h3>
          <p className="text-[11px] text-stone-500 mt-0.5">
            {t('recessionCurrentSub', { quarter: current?.as_of_quarter ?? '—' })}
          </p>

          <div className="mt-3">
            <Gauge
              value={currentProb}
              min={0}
              max={1}
              color={COLORS.red}
              display={fmtProbPct(currentProb, 1)}
              size="sm"
              minLabel="0%"
              maxLabel="100%"
              ariaLabel={`${t('recessionCurrentTitle')}: ${fmtProbPct(currentProb, 1)}`}
            />
          </div>

          {/* always-visible inline caveat next to the headline number */}
          <p className="mt-2 text-[11px] leading-snug text-stone-500">
            {t('recessionCurrentCaveat')}
          </p>

          {/* sparkline with past-recession bands */}
          <div className="mt-4">
            <ProbSparkline
              history={current?.probability_history}
              color={COLORS.red}
              bandsLabel={t('recessionBands')}
              ariaLabel={t('recessionChartAria')}
            />
            <p className="mt-1 text-[10px] text-stone-400">{t('recessionHistory')}</p>
          </div>

          {/* track record — calibration & skill stats, shown plainly */}
          <div className="mt-4">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-2">
              {t('scTitle')}
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <ScoreChip label={t('scAuc')} value={fmtNum(sc?.auc)} />
              <ScoreChip label={t('scVsBase')} value={sgn(sc?.brier_skill_vs_base_rate)} />
              <ScoreChip
                label={t('scVsPersistence')}
                value={sgn(sc?.brier_skill_vs_persistence)}
              />
              <ScoreChip label={t('scEpisodes')} value={fmtNum(sc?.n_oos_episodes, 0)} />
            </div>
          </div>

          <HonestyNote note={current?.honesty_note ?? t('recessionCurrentHonesty')} />
        </div>

        {/* ---- B) 2-QUARTER OUTLOOK ---- */}
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-stone-900">{t('recessionLeadingTitle')}</h3>
            <LabelBadge tone="amber">{t('recessionOutlookBadge')}</LabelBadge>
          </div>
          <p className="text-[11px] text-stone-500 mt-0.5">
            {t('recessionLeadingSub', { quarter: leading?.as_of_quarter ?? '—' })}
          </p>

          <div className="mt-3">
            <Gauge
              value={leadingProb}
              min={0}
              max={1}
              color={COLORS.amber}
              display={fmtProbPct(leadingProb, 1)}
              size="sm"
              minLabel="0%"
              maxLabel="100%"
              ariaLabel={`${t('recessionLeadingTitle')}: ${fmtProbPct(leadingProb, 1)}`}
            />
          </div>

          {/* always-visible inline caveat next to the headline number */}
          <p className="mt-2 text-[11px] leading-snug text-stone-500">
            {t('recessionLeadingCaveat')}
          </p>

          <HonestyNote note={leading?.honesty_note ?? t('recessionLeadingHonesty')} />
        </div>
      </div>

      {/* ---- Sahm labour-market tripwire (full width) ---- */}
      <div className="mt-6 border-t border-stone-100 pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-bold text-stone-900">{t('sahmTitle')}</h3>
          <span
            className={`inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
              sahmTriggered ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {sahmTriggered ? t('sahmTriggered') : t('sahmNotTriggered')}
          </span>
        </div>
        <p className="mt-1.5 text-[11px] leading-snug text-stone-500 tabular-nums">
          {t('sahmDetail', {
            gap: fmtNum(sahm?.latest_gap_pp),
            threshold: fmtNum(sahm?.threshold_pp),
          })}
        </p>
        <HonestyNote note={sahm?.honesty_note ?? t('sahmHonesty')} />
      </div>
    </TileCard>
  );
}
