// Growth-at-Risk tile: the conditional distribution of next-quarter GDP growth,
// rendered as a horizontal number-line / fan. The whole point of this tile is to
// LEAD WITH THE DOWNSIDE (q05/q10) — the only leak-free, COVID-robust part of the
// signal — and to keep the median visibly de-emphasised (it is not authoritative,
// and the band does not beat a GARCH baseline overall). It is risk CONTEXT, not a
// forecast. The honesty_note (verbatim) carries the full audited caveat; a short
// caveat is always visible right next to the headline number.
//
// Inline dependency-free SVG only (matches GdpNowcastChart/GdpTrajectory idiom:
// viewBox + manual scales + <text> labels, stone/teal palette).

import { getTranslations } from 'next-intl/server';
import { TileCard } from './TileCard';
import { toneForLabel } from './LabelBadge';
import { labelKey } from '@/lib/i18n/economy-labels';
import type { GrowthAtRiskTileData, GarQuantiles } from '@/types/economy-dashboard';
import { fmtSignedPct, COLORS } from '@/lib/utils/economy-format';

const DASH = '—';

function ok(v: number | null | undefined): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

export async function GrowthAtRiskTile({
  data,
  locale,
}: {
  data: GrowthAtRiskTileData;
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: 'economics' });
  const lblKey = labelKey(data?.label);

  const q: GarQuantiles = data?.quantiles ?? {};
  const base: GarQuantiles = data?.baseline_quantiles ?? {};

  const q05 = q.q05;
  const q10 = q.q10;
  const q50 = q.q50;
  const q90 = q.q90;
  const q95 = q.q95;

  // ---- chart domain ---------------------------------------------------------
  // Span at least q05..q95; fold in the (faint) baseline edges so the overlay
  // stays in-bounds. Pad a little. Fall back to a small symmetric window if the
  // distribution is missing entirely (null-safe — never throws).
  const domainVals = [q05, q10, q50, q90, q95, base.q05, base.q95].filter(ok);
  let lo: number;
  let hi: number;
  if (domainVals.length > 0) {
    const dMin = Math.min(...domainVals);
    const dMax = Math.max(...domainVals);
    const pad = Math.max((dMax - dMin) * 0.12, 0.0015);
    lo = dMin - pad;
    hi = dMax + pad;
  } else {
    lo = -0.01;
    hi = 0.01;
  }
  const span = hi - lo || 1;

  // ---- geometry -------------------------------------------------------------
  const W = 720;
  const H = 132;
  const padX = 14;
  const plotW = W - padX * 2;
  const baselineY = 58; // centre of the main bands
  const bandH = 26; // outer band height
  const innerH = 16; // inner (teal) band height

  const xAt = (v: number) => padX + ((v - lo) / span) * plotW;

  // Axis ticks: distribution edges + zero (if in-range), via fmtSignedPct.
  const tickVals = Array.from(
    new Set([lo, ...(lo < 0 && hi > 0 ? [0] : []), hi])
  );

  const hasMain = ok(q05) && ok(q95);
  const hasInner = ok(q10) && ok(q90);
  const hasBaseline = ok(base.q05) && ok(base.q95);

  return (
    <TileCard
      title={t('garTitle')}
      eyebrow={t('garEyebrow')}
      label={lblKey ? t(lblKey) : data?.label}
      labelTone={toneForLabel(data?.label)}
      labelTitle={lblKey ? t(lblKey) : data?.label}
      honesty={data?.honesty_note ?? t('garHonesty')}
      accent={COLORS.teal}
    >
      <p className="text-sm text-stone-500 mb-4">{t('garSubtitle')}</p>

      {/* LEAD WITH THE DOWNSIDE: headline = q05, with an always-visible caveat */}
      <div className="mb-1 flex items-baseline gap-2 flex-wrap">
        <span
          className="text-3xl md:text-4xl font-black tabular-nums leading-none"
          style={{ color: COLORS.red }}
        >
          {fmtSignedPct(q05)}
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
          {t('garDownsideRange')}
        </span>
      </div>
      <p className="text-xs text-stone-500 leading-relaxed mb-5 max-w-2xl">
        {t('garCaveat')}
      </p>

      {/* Range / fan number-line */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={t('garChartAria')}
        className="block w-full h-auto"
      >
        {/* outer band q05–q95 (light stone) */}
        {hasMain && (
          <rect
            x={xAt(q05 as number)}
            y={baselineY - bandH / 2}
            width={Math.max(xAt(q95 as number) - xAt(q05 as number), 1)}
            height={bandH}
            rx={3}
            fill={COLORS.stoneFaint}
          />
        )}

        {/* inner band q10–q90 (teal tint) */}
        {hasInner && (
          <rect
            x={xAt(q10 as number)}
            y={baselineY - innerH / 2}
            width={Math.max(xAt(q90 as number) - xAt(q10 as number), 1)}
            height={innerH}
            rx={2}
            fill={COLORS.teal}
            fillOpacity={0.16}
          />
        )}

        {/* faint baseline (GARCH) edges, for reference only */}
        {hasBaseline && (
          <g stroke={COLORS.stone} strokeOpacity={0.6} strokeWidth={1} strokeDasharray="2 3">
            <line
              x1={xAt(base.q05 as number)}
              x2={xAt(base.q05 as number)}
              y1={baselineY - bandH / 2 - 6}
              y2={baselineY + bandH / 2 + 6}
            />
            <line
              x1={xAt(base.q95 as number)}
              x2={xAt(base.q95 as number)}
              y1={baselineY - bandH / 2 - 6}
              y2={baselineY + bandH / 2 + 6}
            />
            <text
              x={xAt(base.q05 as number)}
              y={baselineY + bandH / 2 + 18}
              textAnchor="middle"
              fontSize="9"
              fill={COLORS.stone}
            >
              {t('garBaseline')}
            </text>
          </g>
        )}

        {/* upside edge q90–q95 (light) */}
        {ok(q90) && ok(q95) && (
          <g>
            <line
              x1={xAt(q95 as number)}
              x2={xAt(q95 as number)}
              y1={baselineY - bandH / 2}
              y2={baselineY + bandH / 2}
              stroke={COLORS.stoneDark}
              strokeOpacity={0.5}
              strokeWidth={1.5}
            />
            <text
              x={xAt(q95 as number)}
              y={baselineY - bandH / 2 - 7}
              textAnchor="middle"
              fontSize="10"
              fill={COLORS.stone}
            >
              {t('garUpside')}
            </text>
            <text
              x={xAt(q95 as number)}
              y={baselineY - bandH / 2 - 19}
              textAnchor="middle"
              fontSize="10"
              fontWeight="600"
              fill={COLORS.stoneDark}
              className="tabular-nums"
            >
              {fmtSignedPct(q95)}
            </text>
          </g>
        )}

        {/* median tick q50 — de-emphasised (NOT authoritative) */}
        {ok(q50) && (
          <g>
            <line
              x1={xAt(q50 as number)}
              x2={xAt(q50 as number)}
              y1={baselineY - bandH / 2 - 2}
              y2={baselineY + bandH / 2 + 2}
              stroke={COLORS.stone}
              strokeWidth={1.5}
            />
            <text
              x={xAt(q50 as number)}
              y={baselineY + bandH / 2 + 18}
              textAnchor="middle"
              fontSize="9"
              fill={COLORS.stone}
            >
              {t('garMedian')} {fmtSignedPct(q50)}
            </text>
          </g>
        )}

        {/* DOWNSIDE edge q05/q10 — emphasised in red, bold label */}
        {ok(q10) && (
          <line
            x1={xAt(q10 as number)}
            x2={xAt(q10 as number)}
            y1={baselineY - bandH / 2}
            y2={baselineY + bandH / 2}
            stroke={COLORS.red}
            strokeOpacity={0.55}
            strokeWidth={1.5}
          />
        )}
        {ok(q05) && (
          <g>
            <line
              x1={xAt(q05 as number)}
              x2={xAt(q05 as number)}
              y1={baselineY - bandH / 2 - 3}
              y2={baselineY + bandH / 2 + 3}
              stroke={COLORS.red}
              strokeWidth={3}
            />
            <text
              x={xAt(q05 as number)}
              y={baselineY - bandH / 2 - 19}
              textAnchor="middle"
              fontSize="11"
              fontWeight="700"
              fill={COLORS.red}
            >
              {t('garDownside')}
            </text>
            <text
              x={xAt(q05 as number)}
              y={baselineY - bandH / 2 - 7}
              textAnchor="middle"
              fontSize="11"
              fontWeight="700"
              fill={COLORS.red}
              className="tabular-nums"
            >
              {fmtSignedPct(q05)}
            </text>
          </g>
        )}

        {/* axis ticks (% via fmtSignedPct) */}
        <line
          x1={padX}
          x2={W - padX}
          y1={H - 14}
          y2={H - 14}
          stroke={COLORS.grid}
          strokeWidth={1}
        />
        {tickVals.map((tv, i) => (
          <g key={`tick-${i}`}>
            <line
              x1={xAt(tv)}
              x2={xAt(tv)}
              y1={H - 17}
              y2={H - 11}
              stroke={COLORS.stone}
              strokeWidth={1}
            />
            <text
              x={xAt(tv)}
              y={H - 2}
              textAnchor="middle"
              fontSize="9"
              fill={COLORS.stone}
              className="tabular-nums"
            >
              {fmtSignedPct(tv)}
            </text>
          </g>
        ))}
      </svg>

      {/* compact downside / median / upside read-out (tabular, null-safe) */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
        <div className="rounded-lg border border-stone-200 p-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
            {t('garDownsideRange')}
          </div>
          <div
            className="text-lg font-black tabular-nums"
            style={{ color: COLORS.red }}
          >
            {fmtSignedPct(q05)} {DASH} {fmtSignedPct(q10)}
          </div>
        </div>
        <div className="rounded-lg border border-stone-200 p-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
            {t('garMedian')}
          </div>
          <div className="text-lg font-bold tabular-nums text-stone-500">
            {fmtSignedPct(q50)}
          </div>
        </div>
        <div className="rounded-lg border border-stone-200 p-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
            {t('garUpsideRange')}
          </div>
          <div className="text-lg font-bold tabular-nums text-stone-500">
            {fmtSignedPct(q90)} {DASH} {fmtSignedPct(q95)}
          </div>
        </div>
      </div>
    </TileCard>
  );
}
