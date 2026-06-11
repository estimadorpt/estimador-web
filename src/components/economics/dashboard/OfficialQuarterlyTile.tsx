// Demoted "official q/q GDP nowcast" tile. This is the LEAST authoritative number
// on the dashboard: a preliminary, noisy in-quarter combination (shrink_combo at
// M1/M2: supply-side bridge + factor DFM + ESI momentum with a hard AR(1) floor;
// certified supply_side_bridge at M3). Rendered visually SMALLER and MUTED (not
// hero), with an always-visible caveat and — when is_meaningful is false — a
// prominent "early / unreliable" badge so a journalist cannot mistake it for a
// result. The payload honesty_note (which flags the M2 combo as PROVISIONAL) is
// rendered VERBATIM via the collapsible; we do not editorialize beyond it.
// Extras: member-weights strip (combo_weights/combo_member_points), implied YoY,
// and the first_release_note footnote.
//
// Dependency-free inline SVG only (matches GdpNowcastChart / GdpTrajectory). All
// fields are optional; everything is guarded with optional chaining + "—".

import { getTranslations } from 'next-intl/server';
import { TileCard } from './TileCard';
import { LabelBadge } from './LabelBadge';
import { labelKey } from '@/lib/i18n/economy-labels';
import type { OfficialQuarterlyTileData } from '@/types/economy-dashboard';
import { fmtSignedPct, fmtSignedNum, COLORS } from '@/lib/utils/economy-format';

// Map backend sector composite keys -> i18n key (fallback to the raw name).
const SECTOR_KEYS: Record<string, string> = {
  industry: 'sectorIndustry',
  services: 'sectorServices',
  construction: 'sectorConstruction',
  domestic: 'sectorDomestic',
  external: 'sectorExternal',
};

function isNum(v: number | null | undefined): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

// Combo member display: fixed order + i18n key + a muted editorial palette.
// The raw model id is kept as the HTML `title` so the provenance stays visible.
const COMBO_MEMBERS: Array<{ id: string; nameKey: string; color: string }> = [
  { id: 'ar1', nameKey: 'comboAr1', color: '#a8a29e' },
  { id: 'supply_side_bridge', nameKey: 'comboBridge', color: '#1B4D5E' },
  { id: 'factor_dfm', nameKey: 'comboFactorDfm', color: '#3a7d92' },
  { id: 'esi_momentum', nameKey: 'comboEsiMomentum', color: '#b45309' },
];

export async function OfficialQuarterlyTile({
  data,
  locale,
}: {
  data: OfficialQuarterlyTileData;
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: 'economics' });
  const lblKey = labelKey(data?.label);

  const point = data?.point_qoq;
  const ci80 = data?.ci_80;
  const ci95 = data?.ci_95;
  const ci80lo = ci80?.[0];
  const ci80hi = ci80?.[1];
  const ci95lo = ci95?.[0];
  const ci95hi = ci95?.[1];
  const isEarly = data?.is_meaningful === false;
  const calibrated = data?.band_calibrated === true;

  // ---- calibrated band viz (inline SVG) -----------------------------------
  // A small horizontal band centred on the point: ci_95 (outer, faint) and
  // ci_80 (inner, teal). Domain spans the widest available CI with a little
  // padding; drawn to scale so the band is honestly wide. Null-safe: only the
  // pieces with finite numbers are drawn.
  const W = 360;
  const H = 64;
  const padX = 12;
  const trackY = 26;
  const innerH = 14;
  const outerH = 8;

  const domainVals: number[] = [];
  for (const v of [ci95lo, ci95hi, ci80lo, ci80hi, point, 0]) {
    if (isNum(v)) domainVals.push(v);
  }
  const haveDomain = domainVals.length > 0;
  const rawMin = haveDomain ? Math.min(...domainVals) : -0.01;
  const rawMax = haveDomain ? Math.max(...domainVals) : 0.01;
  const spanRaw = Math.max(rawMax - rawMin, 0.001);
  const pad = spanRaw * 0.12;
  const dMin = rawMin - pad;
  const dMax = rawMax + pad;
  const xAt = (v: number) =>
    padX + ((v - dMin) / (dMax - dMin)) * (W - padX * 2);

  const haveBand =
    isNum(ci95lo) && isNum(ci95hi) && ci95hi! > ci95lo!;
  const zeroX = xAt(0);
  const pointColor = isNum(point) && point! < 0 ? COLORS.red : COLORS.teal;

  return (
    <TileCard
      title={t('officialTitle')}
      eyebrow={t('officialEyebrow')}
      label={lblKey ? t(lblKey) : data?.label}
      labelTone="amber"
      honesty={data?.honesty_note ?? t('officialHonesty')}
      className="opacity-95"
    >
      {/* Headline: deliberately SMALLER than a hero tile, muted stone tone. */}
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
          {t('officialPoint')}
        </span>
        <span
          className="text-2xl md:text-3xl font-bold tabular-nums"
          style={{ color: pointColor }}
        >
          {fmtSignedPct(point)}
        </span>
        <span className="text-xs text-stone-400">{t('qoq')}</span>
        {isEarly && (
          <LabelBadge tone="red" title={t('officialCaveat')}>
            {t('officialEarly')}
          </LabelBadge>
        )}
      </div>

      {/* ALWAYS-visible inline caveat (not only in the collapsible). */}
      <p className="mt-1.5 text-xs leading-relaxed text-stone-500 max-w-prose">
        {t('officialCaveat')}
      </p>

      {/* Implied YoY: nowcast q/q plus the three published prior quarters. */}
      {isNum(data?.implied_yoy?.point_yoy) && (
        <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
            {t('officialImpliedYoy')}
          </span>
          <span className="text-lg font-bold tabular-nums text-stone-700">
            {fmtSignedPct(data.implied_yoy!.point_yoy, 1)}
          </span>
          <span className="text-xs text-stone-400">{t('yoy')}</span>
          {Array.isArray(data?.implied_yoy?.ci_80) && (
            <span className="text-[11px] tabular-nums text-stone-400">
              {t('officialBand80')}: {fmtSignedPct(data.implied_yoy!.ci_80![0], 1)}…
              {fmtSignedPct(data.implied_yoy!.ci_80![1], 1)}
            </span>
          )}
        </div>
      )}

      {/* Calibrated band: ci_95 (outer) + ci_80 (inner), centred on the point. */}
      {haveBand && (
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              {t('officialBand95')}
            </span>
            {calibrated && (
              <LabelBadge tone="teal">{t('officialCalibrated')}</LabelBadge>
            )}
            {data?.band_shape === 'asymmetric' && (
              <span className="text-[10px] text-stone-400">
                {t('officialAsymmetric')}
              </span>
            )}
          </div>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            role="img"
            aria-label={`${t('officialBand95')}: ${fmtSignedPct(ci95lo)} … ${fmtSignedPct(
              ci95hi
            )}`}
            className="block w-full h-auto max-w-[420px]"
          >
            {/* zero reference line */}
            {zeroX >= padX && zeroX <= W - padX && (
              <line
                x1={zeroX}
                x2={zeroX}
                y1={trackY - 16}
                y2={trackY + 16}
                stroke={COLORS.grid}
                strokeWidth={1}
              />
            )}

            {/* outer ci_95 band */}
            <rect
              x={xAt(ci95lo!)}
              y={trackY - outerH / 2}
              width={Math.max(xAt(ci95hi!) - xAt(ci95lo!), 1)}
              height={outerH}
              rx={2}
              fill={COLORS.teal}
              fillOpacity={0.16}
            />

            {/* inner ci_80 band */}
            {isNum(ci80lo) && isNum(ci80hi) && ci80hi! > ci80lo! && (
              <rect
                x={xAt(ci80lo!)}
                y={trackY - innerH / 2}
                width={Math.max(xAt(ci80hi!) - xAt(ci80lo!), 1)}
                height={innerH}
                rx={2}
                fill={COLORS.teal}
                fillOpacity={0.32}
              />
            )}

            {/* point estimate marker */}
            {isNum(point) && (
              <line
                x1={xAt(point!)}
                x2={xAt(point!)}
                y1={trackY - innerH / 2 - 3}
                y2={trackY + innerH / 2 + 3}
                stroke={pointColor}
                strokeWidth={2.5}
                strokeLinecap="round"
              />
            )}

            {/* endpoint labels for ci_95 */}
            <text
              x={xAt(ci95lo!)}
              y={trackY + 26}
              textAnchor="middle"
              fontSize="10"
              fill={COLORS.stone}
              className="tabular-nums"
            >
              {fmtSignedPct(ci95lo)}
            </text>
            <text
              x={xAt(ci95hi!)}
              y={trackY + 26}
              textAnchor="middle"
              fontSize="10"
              fill={COLORS.stone}
              className="tabular-nums"
            >
              {fmtSignedPct(ci95hi)}
            </text>
          </svg>

          {/* legend: 80% vs 95% band, exact values */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-[11px] text-stone-500">
            <span className="inline-flex items-center gap-1.5">
              <span
                className="inline-block w-3 h-3 rounded-sm"
                style={{ backgroundColor: COLORS.teal, opacity: 0.32 }}
              />
              <span className="tabular-nums">
                {t('officialBand80')}: {fmtSignedPct(ci80lo)}…{fmtSignedPct(ci80hi)}
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="inline-block w-3 h-3 rounded-sm"
                style={{ backgroundColor: COLORS.teal, opacity: 0.16 }}
              />
              <span className="tabular-nums">
                {t('officialBand95')}: {fmtSignedPct(ci95lo)}…{fmtSignedPct(ci95hi)}
              </span>
            </span>
          </div>
        </div>
      )}

      {/* Member-weights strip: who carries the combination, drawn to scale. */}
      {data?.combo_weights && Object.keys(data.combo_weights).length > 0 && (
        <div className="mt-5 border-t border-stone-100 pt-4">
          <h3 className="text-[11px] font-semibold uppercase tracking-wide text-stone-600 mb-2">
            {t('officialWeightsTitle')}
          </h3>
          {(() => {
            const members = COMBO_MEMBERS.filter((m) =>
              isNum(data.combo_weights?.[m.id])
            );
            // Include any unexpected member keys so nothing is silently dropped.
            const extras = Object.keys(data.combo_weights!)
              .filter((k) => !COMBO_MEMBERS.some((m) => m.id === k))
              .map((k) => ({ id: k, nameKey: '', color: '#78716c' }));
            const all = [...members, ...extras];
            const total = all.reduce(
              (s, m) => s + (data.combo_weights?.[m.id] ?? 0),
              0
            );
            if (all.length === 0 || total <= 0) return null;
            return (
              <>
                {/* 100% stacked bar */}
                <div className="flex h-3 w-full max-w-[420px]" role="img" aria-label={t('officialWeightsTitle')}>
                  {all.map((m) => {
                    const w = ((data.combo_weights?.[m.id] ?? 0) / total) * 100;
                    return (
                      <span
                        key={m.id}
                        title={m.id}
                        style={{ width: `${w}%`, backgroundColor: m.color }}
                      />
                    );
                  })}
                </div>
                {/* labelled chips: name · weight · member point */}
                <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-stone-500">
                  {all.map((m) => {
                    const w = data.combo_weights?.[m.id];
                    const pt = data.combo_member_points?.[m.id];
                    return (
                      <li key={m.id} className="inline-flex items-center gap-1.5" title={m.id}>
                        <span
                          className="inline-block w-2.5 h-2.5"
                          style={{ backgroundColor: m.color }}
                        />
                        <span className="font-medium text-stone-600">
                          {m.nameKey ? t(m.nameKey) : m.id}
                        </span>
                        <span className="tabular-nums">
                          {isNum(w) ? `${Math.round((w! / total) * 100)}%` : '—'}
                        </span>
                        {isNum(pt) && (
                          <span className="tabular-nums text-stone-400">
                            · {fmtSignedPct(pt, 1)}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-1.5 text-[10px] text-stone-400">
                  {t('officialWeightsNote', { model: data?.model ?? '—' })}
                </p>
              </>
            );
          })()}
        </div>
      )}

      {/* Vintage line (how much of the quarter's data is in). */}
      <p className="mt-4 text-[11px] text-stone-400">
        {t('officialVintage', {
          position: data?.position ?? '—',
          pct: Math.round((data?.pct_complete ?? 0) * 100),
        })}
      </p>

      {/* First-release footnote (verbatim payload string). */}
      {data?.first_release_note && (
        <p className="mt-2 text-[10px] leading-snug text-stone-400 max-w-prose border-t border-stone-100 pt-2">
          {data.first_release_note}
        </p>
      )}

      {/* Sector composites: small diverging bars (z-scores). */}
      {Array.isArray(data?.sector_composites) &&
        data.sector_composites.length > 0 && (
          <div className="mt-5 border-t border-stone-100 pt-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-stone-600 mb-2.5">
              {t('officialSectorsTitle')}
            </h3>
            <SectorComposites
              composites={data.sector_composites}
              label={(name) => {
                const key = SECTOR_KEYS[name?.toLowerCase?.() ?? ''];
                return key ? t(key) : name || '—';
              }}
            />
            <p className="mt-2.5 text-[11px] text-stone-400">
              {t('officialSectorsNote')}
            </p>
          </div>
        )}
    </TileCard>
  );
}

// Tiny diverging-bar list for the standardized sector composites. Bars grow from
// a shared centre: positive (teal) to the right, negative (red) to the left,
// scaled by the largest absolute z-score so the widths stay comparable.
function SectorComposites({
  composites,
  label,
}: {
  composites: OfficialQuarterlyTileData['sector_composites'];
  label: (name: string) => string;
}) {
  const list = (composites ?? []).filter((c) => c && typeof c.name === 'string');
  if (list.length === 0) return null;

  const maxAbs = Math.max(
    0.5,
    ...list.map((c) => (isNum(c.value) ? Math.abs(c.value) : 0))
  );

  return (
    <ul className="space-y-2">
      {list.map((c, i) => {
        const v = c?.value;
        const hasVal = isNum(v);
        const positive = hasVal && v! >= 0;
        const width = hasVal ? (Math.abs(v!) / maxAbs) * 50 : 0; // % of half-track
        const barColor = positive ? COLORS.teal : COLORS.red;
        return (
          <li
            key={`${c?.name ?? 'sector'}-${i}`}
            className="grid grid-cols-[7.5rem_1fr_3rem] items-center gap-2"
          >
            <span className="text-xs text-stone-600 truncate" title={label(c?.name ?? '')}>
              {label(c?.name ?? '')}
            </span>
            {/* diverging track, centred */}
            <span className="relative block h-2.5 rounded-sm bg-stone-100">
              <span className="absolute inset-y-0 left-1/2 w-px bg-stone-300" aria-hidden />
              {hasVal && (
                <span
                  className="absolute inset-y-0 rounded-sm"
                  style={{
                    backgroundColor: barColor,
                    opacity: 0.8,
                    left: positive ? '50%' : `${50 - width}%`,
                    width: `${width}%`,
                  }}
                />
              )}
            </span>
            <span
              className="text-xs font-semibold tabular-nums text-right"
              style={{ color: hasVal ? barColor : COLORS.stone }}
            >
              {fmtSignedNum(v)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
