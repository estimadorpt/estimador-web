// Annual outlook tile — the page's editorial centerpiece. Median annual GDP
// growth for the target year, the p10–p90 simulated distribution as a
// horizontal strip, a probability ladder, and the institutional CONSENSUS
// overlay (each forecast placed at its percentile on OUR distribution —
// proximity is context, not validation; the payload note says so verbatim).
//
// HONEST framing (load-bearing): carryover + AR(1) extrapolation do most of
// the work; backtested intervals missed in every crisis year; assumes no new
// shock. The payload honesty_note is rendered verbatim in the collapsible,
// with the replay validation stats (cov80, CRPS skill) cited alongside.
//
// Units: all values here are ALREADY percent (annual average real GDP growth).
// Pure server component; dependency-free inline SVG.

import { getTranslations } from 'next-intl/server';
import { TileCard } from './TileCard';
import {
  COLORS,
  fmtSignedPctValue,
  fmtProbPct,
  fmtNum,
  fmtDate,
} from '@/lib/utils/economy-format';
import { labelKey } from '@/lib/i18n/economy-labels';
import type {
  AnnualOutlookTileData,
  ConsensusForecast,
} from '@/types/economy-dashboard';

function isNum(v: number | null | undefined): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

// Short codes for the consensus dots (full name stays in the inline list +
// the SVG <title>). Fallback: the payload institution string as-is.
const INSTITUTION_SHORT: Record<string, string> = {
  'Banco de Portugal': 'BdP',
  IMF: 'IMF',
  'Governo (Ministério das Finanças)': 'Gov',
  'European Commission': 'EC',
  OECD: 'OECD',
};

export async function AnnualOutlookTile({
  data,
  locale,
}: {
  data: AnnualOutlookTileData;
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: 'economics' });
  const lblKey = labelKey(data?.label);

  const bands = data?.bands ?? {};
  const ladder = data?.prob_ladder ?? {};
  const consensus = Array.isArray(data?.consensus?.forecasts)
    ? data.consensus!.forecasts!.filter((f) => f && isNum(f.value_pct))
    : [];

  // Quantile knots (value, percentile) for the piecewise-linear value→pct map
  // used for the carryover floor (consensus dots carry their own percentile).
  const knots: Array<[number, number]> = (
    [
      [bands.p10, 10],
      [bands.p25, 25],
      [bands.p50, 50],
      [bands.p75, 75],
      [bands.p90, 90],
    ] as Array<[number | undefined, number]>
  ).filter((k): k is [number, number] => isNum(k[0]));

  const valueToPct = (v: number): number => {
    if (knots.length < 2) return 50;
    if (v <= knots[0][0]) return knots[0][1];
    for (let i = 1; i < knots.length; i++) {
      if (v <= knots[i][0]) {
        const [v0, p0] = knots[i - 1];
        const [v1, p1] = knots[i];
        const f = v1 === v0 ? 0 : (v - v0) / (v1 - v0);
        return p0 + f * (p1 - p0);
      }
    }
    return knots[knots.length - 1][1];
  };

  // ---- distribution strip geometry (percentile axis 5..95 → x) -------------
  const W = 720;
  const H = 168;
  const padX = 26;
  const stripY = 116;
  const stripH = 18;
  const innerH = 28;
  const pctLo = 5;
  const pctHi = 95;
  const xAt = (pct: number) =>
    padX + ((Math.max(pctLo, Math.min(pctHi, pct)) - pctLo) / (pctHi - pctLo)) * (W - padX * 2);

  const haveStrip = isNum(bands.p10) && isNum(bands.p90);

  // Stagger consensus dot labels in two rows to avoid collisions.
  const dots = consensus
    .map((f) => ({
      ...f,
      pct: isNum(f.percentile_on_our_distribution)
        ? (f.percentile_on_our_distribution as number)
        : valueToPct(f.value_pct as number),
    }))
    .sort((a, b) => a.pct - b.pct);

  const floorPct = isNum(data?.carryover_floor) ? valueToPct(data.carryover_floor as number) : null;

  const ladderItems: Array<{ label: string; p?: number }> = [
    { label: t('annualPgt0'), p: ladder.gt_0 },
    { label: t('annualPgt1'), p: ladder.gt_1 },
    { label: t('annualPgt2'), p: ladder.gt_2 },
    { label: t('annualPgt3'), p: ladder.gt_3 },
  ];

  // Honesty: payload note verbatim + the replay validation stats cited inline.
  const v = data?.validation;
  const validationLine = v
    ? ' ' +
      t('annualValidationLine', {
        years: v.replay_years ?? '—',
        cov80: isNum(v.cov80_all) ? Math.round((v.cov80_all as number) * 100) : 0,
        cov80ex: isNum(v.cov80_excl_covid) ? Math.round((v.cov80_excl_covid as number) * 100) : 0,
        crps: isNum(v.crps_skill_vs_climatology)
          ? Math.round((v.crps_skill_vs_climatology as number) * 100)
          : 0,
        crpsEx: isNum(v.crps_skill_excl_covid)
          ? Math.round((v.crps_skill_excl_covid as number) * 100)
          : 0,
      })
    : '';
  const honesty = `${data?.honesty_note ?? ''}${validationLine}`.trim() || undefined;

  return (
    <TileCard
      title={t('annualTitle', { year: data?.target_year ?? '—' })}
      eyebrow={t('annualEyebrow')}
      label={lblKey ? t(lblKey) : data?.label}
      labelTone="neutral"
      honesty={honesty}
      accent={COLORS.teal}
      hero
    >
      {/* ---- headline: median annual growth ---------------------------------- */}
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span
          className="text-4xl md:text-5xl font-black tabular-nums tracking-tighter leading-none"
          style={{ color: isNum(data?.median) && (data.median as number) < 0 ? COLORS.red : COLORS.teal }}
        >
          {fmtSignedPctValue(data?.median, 1)}
        </span>
        <span className="text-sm text-stone-500">{t('annualMedianLabel')}</span>
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-stone-500 max-w-prose">
        {t('annualCaveat', {
          published: data?.published_through ?? '—',
          nowcast: data?.nowcast_quarter ?? '—',
          floor: fmtSignedPctValue(data?.carryover_floor, 1),
        })}
      </p>

      {/* ---- distribution strip + consensus overlay --------------------------- */}
      {haveStrip && (
        <div className="mt-5">
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              {t('annualStripTitle')}
            </span>
            <span className="text-[10px] text-stone-400">{t('annualStripUnits')}</span>
          </div>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            role="img"
            aria-label={t('annualChartAria')}
            className="block w-full h-auto"
          >
            {/* consensus dots + staggered labels (above the strip) */}
            {dots.map((f, i) => {
              const x = xAt(f.pct);
              const rowY = i % 2 === 0 ? 30 : 62;
              const short =
                INSTITUTION_SHORT[f.institution ?? ''] ?? f.institution ?? '—';
              return (
                <g key={`${f.institution}-${i}`}>
                  <title>
                    {`${f.institution ?? '—'} · ${fmtSignedPctValue(f.value_pct, 1)} · ${
                      f.publication ?? ''
                    }${f.pub_date ? ` (${f.pub_date})` : ''} · P${fmtNum(f.pct, 0)}`}
                  </title>
                  <line
                    x1={x}
                    x2={x}
                    y1={rowY + 6}
                    y2={stripY - 4}
                    stroke={COLORS.stone}
                    strokeWidth={1}
                    strokeDasharray="2 3"
                  />
                  <circle cx={x} cy={stripY + stripH / 2} r={4} fill={COLORS.stoneDark} />
                  <text
                    x={x}
                    y={rowY - 6}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="700"
                    fill={COLORS.stoneDark}
                  >
                    {short}
                  </text>
                  <text
                    x={x}
                    y={rowY + 4}
                    textAnchor="middle"
                    fontSize="9"
                    fill={COLORS.stone}
                    className="tabular-nums"
                  >
                    {fmtSignedPctValue(f.value_pct, 1)}
                  </text>
                </g>
              );
            })}

            {/* p10–p90 outer band */}
            <rect
              x={xAt(10)}
              y={stripY}
              width={Math.max(xAt(90) - xAt(10), 1)}
              height={stripH}
              fill={COLORS.teal}
              fillOpacity={0.14}
            />
            {/* p25–p75 inner band */}
            {isNum(bands.p25) && isNum(bands.p75) && (
              <rect
                x={xAt(25)}
                y={stripY + (stripH - innerH) / 2 + (innerH - stripH) / 2}
                width={Math.max(xAt(75) - xAt(25), 1)}
                height={stripH}
                fill={COLORS.teal}
                fillOpacity={0.28}
              />
            )}
            {/* median line */}
            <line
              x1={xAt(50)}
              x2={xAt(50)}
              y1={stripY - 5}
              y2={stripY + stripH + 5}
              stroke={COLORS.teal}
              strokeWidth={2.5}
            />
            {/* carryover floor tick */}
            {floorPct !== null && (
              <g>
                <line
                  x1={xAt(floorPct)}
                  x2={xAt(floorPct)}
                  y1={stripY - 3}
                  y2={stripY + stripH + 3}
                  stroke={COLORS.amber}
                  strokeWidth={1.5}
                  strokeDasharray="3 2"
                />
                <text
                  x={xAt(floorPct)}
                  y={stripY + stripH + 16}
                  textAnchor="middle"
                  fontSize="9"
                  fill={COLORS.amber}
                  className="tabular-nums"
                >
                  {t('annualFloorTick')} {fmtSignedPctValue(data?.carryover_floor, 1)}
                </text>
              </g>
            )}

            {/* quantile tick labels under the strip */}
            {(
              [
                [10, bands.p10],
                [25, bands.p25],
                [50, bands.p50],
                [75, bands.p75],
                [90, bands.p90],
              ] as Array<[number, number | undefined]>
            )
              .filter((d): d is [number, number] => isNum(d[1]))
              .map(([pct, val]) => (
                <g key={`q-${pct}`}>
                  <line
                    x1={xAt(pct)}
                    x2={xAt(pct)}
                    y1={stripY + stripH}
                    y2={stripY + stripH + 4}
                    stroke={COLORS.stone}
                    strokeWidth={1}
                  />
                  <text
                    x={xAt(pct)}
                    y={stripY + stripH + 28}
                    textAnchor="middle"
                    fontSize="9"
                    fill={COLORS.stone}
                    className="tabular-nums"
                  >
                    {fmtSignedPctValue(val, 1)}
                  </text>
                  <text
                    x={xAt(pct)}
                    y={stripY + stripH + 38}
                    textAnchor="middle"
                    fontSize="8"
                    fill={COLORS.stone}
                  >
                    p{pct}
                  </text>
                </g>
              ))}
          </svg>
        </div>
      )}

      {/* ---- consensus inline list (accessible, exact values + dates) --------- */}
      {dots.length > 0 && (
        <div className="mt-2">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1.5">
            {t('annualConsensusTitle')}
          </h3>
          <ul className="flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-stone-500">
            {dots.map((f: ConsensusForecast & { pct: number }, i) => (
              <li key={`c-${i}`} className="inline-flex items-baseline gap-1.5">
                <span className="font-medium text-stone-600">{f.institution ?? '—'}</span>
                <span className="font-semibold tabular-nums text-stone-700">
                  {fmtSignedPctValue(f.value_pct, 1)}
                </span>
                {f.pub_date && (
                  <span className="text-stone-400">{fmtDate(f.pub_date, locale)}</span>
                )}
                <span className="tabular-nums text-stone-400">
                  · P{fmtNum(f.pct, 0)}
                </span>
              </li>
            ))}
          </ul>
          {data?.consensus?.note && (
            <p className="mt-1.5 text-[10px] leading-snug text-stone-400 max-w-prose">
              {data.consensus.note}
            </p>
          )}
        </div>
      )}

      {/* ---- probability ladder ------------------------------------------------ */}
      <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-px bg-stone-200 border border-stone-200">
        {ladderItems.map((item, i) => (
          <div key={`l-${i}`} className="bg-white p-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              {item.label}
            </div>
            <div className="text-2xl font-black tabular-nums text-stone-800 mt-0.5">
              {fmtProbPct(item.p, 0)}
            </div>
          </div>
        ))}
      </div>

      {/* provenance footnote: what seeds the in-year part of the simulation */}
      {data?.nowcast_seed?.source && (
        <p className="mt-3 text-[10px] text-stone-400">
          {t('annualSeedNote')}: {data.nowcast_seed.source}
          {data?.nowcast_source ? ` (${data.nowcast_source})` : ''}
        </p>
      )}
    </TileCard>
  );
}
