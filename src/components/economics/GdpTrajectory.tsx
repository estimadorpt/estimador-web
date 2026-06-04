// Dependency-free SVG view of how the current-quarter GDP nowcast firms up as
// data arrives (M1 -> M2 -> M3). Mirrors GdpNowcastChart.tsx: a plain SVG server
// component, zero runtime deps, brand teal + stone palette.
//
// HONEST FRAMING (load-bearing): this is a TIMELINESS/transparency view, not an
// accuracy gain. Only the quarter-end (M3) read has verified skill; M1/M2 are
// preliminary and not yet better than a naive benchmark. The error whiskers are
// drawn TO SCALE and stay the same wide ~1.0pp width at every milestone, so the
// estimate visibly firms (the point moves) WITHOUT pretending to get more
// precise. The status badges and reliability copy say the same in words.

import type {
  EconomicsTrajectoryVintage,
  EconomicsTrajectorySectorDelta,
} from "@/types/economics";

interface TrajectoryLabels {
  stepM1: string;
  stepM2: string;
  stepM3: string;
  pendingBadge: string;
  preliminaryBadge: string;
  authoritativeBadge: string;
  reliabilityPreliminary: string;
  reliabilityAuthoritative: string;
  reliabilityPending: string;
  officialOutturnLabel: string;
  bandWhiskerLabel: string;
  movedBy: string; // e.g. "{sector} moved the estimate the most"
}

interface Props {
  vintages: EconomicsTrajectoryVintage[];
  currentPosition?: string;
  officialOutturn?: number;
  sectorDeltas?: EconomicsTrajectorySectorDelta[];
  labels: TrajectoryLabels;
  locale: string;
}

const TEAL = "#1B4D5E";
const STONE = "#a8a29e";
const STONE_DARK = "#57534e";
const RED = "#ef4444";
const AMBER = "#b45309";

function fmtSignedPct(v: number): string {
  const pct = v * 100;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;
}

function stepLabel(v: EconomicsTrajectoryVintage, labels: TrajectoryLabels): string {
  if (v.vintage === "M1") return labels.stepM1;
  if (v.vintage === "M2") return labels.stepM2;
  return labels.stepM3;
}

function localizedDate(iso: string | null, locale: string): string {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(locale === "pt" ? "pt-PT" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Sector display names are sourced from the same i18n-free composite keys the
// backend emits. We title-case the ASCII key for the "what moved" caption.
function prettySector(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function GdpTrajectory({
  vintages,
  currentPosition,
  officialOutturn,
  sectorDeltas,
  labels,
  locale,
}: Props) {
  const W = 720;
  const H = 280;
  const padX = 56;
  const padTop = 24;
  const padBottom = 36;
  const plotH = H - padTop - padBottom;
  const plotW = W - padX * 2;

  // Y-scale spans every available point AND its full error band AND the official
  // outturn (demo mode) so the wide whiskers are drawn honestly to scale.
  const yVals: number[] = [0];
  for (const v of vintages) {
    if (v.point !== null) yVals.push(v.point);
    if (v.typical_error_band) {
      yVals.push(v.typical_error_band[0], v.typical_error_band[1]);
    }
  }
  if (typeof officialOutturn === "number") yVals.push(officialOutturn);
  const yMin = Math.min(...yVals);
  const yMax = Math.max(...yVals);
  const span = Math.max(yMax - yMin, 0.005);
  const pad = span * 0.12;
  const lo = yMin - pad;
  const hi = yMax + pad;
  const yToPx = (y: number) => padTop + plotH * (1 - (y - lo) / (hi - lo));

  const n = vintages.length;
  const slot = plotW / Math.max(n, 1);
  const xAt = (i: number) => padX + slot * i + slot / 2;

  const zeroY = yToPx(0);
  const outturnY =
    typeof officialOutturn === "number" ? yToPx(officialOutturn) : null;

  // Segments connect consecutive AVAILABLE points only.
  const available = vintages
    .map((v, i) => ({ v, i }))
    .filter((p) => p.v.point !== null);

  const markerFor = (v: EconomicsTrajectoryVintage): string => {
    if (v.status === "pending") return STONE;
    if (v.status === "authoritative") return TEAL;
    return STONE; // preliminary
  };

  // Status -> badge classes (identical palette to economia/page.tsx headline).
  const badgeClass = (status: string): string => {
    if (status === "authoritative") return "bg-emerald-100 text-emerald-700";
    if (status === "pending") return "bg-stone-100 text-stone-500";
    return "bg-amber-100 text-amber-700"; // preliminary
  };
  const badgeText = (status: string): string => {
    if (status === "authoritative") return labels.authoritativeBadge;
    if (status === "pending") return labels.pendingBadge;
    return labels.preliminaryBadge;
  };
  const reliabilityText = (status: string): string => {
    if (status === "authoritative") return labels.reliabilityAuthoritative;
    if (status === "pending") return labels.reliabilityPending;
    return labels.reliabilityPreliminary;
  };

  // "What moved the estimate" caption: the latest available sector delta.
  let movedCaption: string | null = null;
  if (sectorDeltas && sectorDeltas.length > 0) {
    const last = sectorDeltas[sectorDeltas.length - 1];
    if (last.by_sector && last.by_sector.length > 0) {
      const top = [...last.by_sector].sort(
        (a, b) => Math.abs(b.delta) - Math.abs(a.delta)
      )[0];
      movedCaption = labels.movedBy.replace("{sector}", prettySector(top.name));
    }
  }

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height="auto"
        role="img"
        aria-label="GDP nowcast trajectory through the quarter"
      >
        {/* zero baseline */}
        <line
          x1={padX}
          x2={W - padX}
          y1={zeroY}
          y2={zeroY}
          stroke="#e7e5e4"
          strokeWidth={1}
        />
        <text x={padX - 8} y={zeroY + 3} textAnchor="end" fontSize="9" fill="#a8a29e">
          0%
        </text>

        {/* official outturn reference line (demo mode) */}
        {outturnY !== null && (
          <g>
            <line
              x1={padX}
              x2={W - padX}
              y1={outturnY}
              y2={outturnY}
              stroke={STONE_DARK}
              strokeWidth={1}
              strokeDasharray="5 4"
            />
            <text
              x={W - padX}
              y={outturnY - 5}
              textAnchor="end"
              fontSize="10"
              fill={STONE_DARK}
            >
              {labels.officialOutturnLabel}: {fmtSignedPct(officialOutturn as number)}
            </text>
          </g>
        )}

        {/* connecting line between available points */}
        {available.length > 1 && (
          <polyline
            points={available
              .map((p) => `${xAt(p.i)},${yToPx(p.v.point as number)}`)
              .join(" ")}
            fill="none"
            stroke={TEAL}
            strokeWidth={2}
            strokeOpacity={0.55}
          />
        )}

        {vintages.map((v, i) => {
          const cx = xAt(i);
          const isPending = v.status === "pending" || v.point === null;
          const color = markerFor(v);
          const pointColor =
            v.point !== null && v.point < 0 && !isPending ? RED : color;

          return (
            <g key={v.vintage}>
              {/* error whisker — drawn TO SCALE; same wide width at every
                  milestone so the band visibly does NOT shrink to false precision */}
              {v.typical_error_band && (
                <g stroke={pointColor} strokeOpacity={0.5} strokeWidth={1.5}>
                  <line
                    x1={cx}
                    x2={cx}
                    y1={yToPx(v.typical_error_band[0])}
                    y2={yToPx(v.typical_error_band[1])}
                  />
                  <line
                    x1={cx - 5}
                    x2={cx + 5}
                    y1={yToPx(v.typical_error_band[0])}
                    y2={yToPx(v.typical_error_band[0])}
                  />
                  <line
                    x1={cx - 5}
                    x2={cx + 5}
                    y1={yToPx(v.typical_error_band[1])}
                    y2={yToPx(v.typical_error_band[1])}
                  />
                </g>
              )}

              {/* marker: solid for available, hollow+dashed for pending */}
              {isPending ? (
                <circle
                  cx={cx}
                  cy={zeroY}
                  r={5}
                  fill="white"
                  stroke={STONE}
                  strokeWidth={1.5}
                  strokeDasharray="3 2"
                />
              ) : (
                <circle cx={cx} cy={yToPx(v.point as number)} r={5} fill={pointColor} />
              )}

              {/* point value label */}
              {!isPending && (
                <text
                  x={cx}
                  y={yToPx(v.point as number) - 12}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="600"
                  fill={pointColor}
                >
                  {fmtSignedPct(v.point as number)}
                </text>
              )}

              {/* milestone label on the X axis */}
              <text
                x={cx}
                y={H - padBottom + 16}
                textAnchor="middle"
                fontSize="11"
                fontWeight={
                  currentPosition && currentPosition === v.vintage ? "700" : "400"
                }
                fill={
                  currentPosition && currentPosition === v.vintage
                    ? TEAL
                    : STONE_DARK
                }
              >
                {stepLabel(v, labels)}
              </text>
              <text
                x={cx}
                y={H - padBottom + 29}
                textAnchor="middle"
                fontSize="9"
                fill="#a8a29e"
              >
                {isPending ? labels.pendingBadge : localizedDate(v.as_of, locale)}
              </text>
            </g>
          );
        })}
      </svg>

      {/* legend: whisker meaning */}
      <div className="flex flex-wrap items-center gap-4 mt-2 text-[11px] text-stone-500">
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block w-0.5 h-3.5"
            style={{ backgroundColor: STONE, opacity: 0.6 }}
          />
          {labels.bandWhiskerLabel}
        </span>
        {outturnY !== null && (
          <span className="inline-flex items-center gap-1.5">
            <span
              className="inline-block w-4 h-0"
              style={{ borderTop: `2px dashed ${STONE_DARK}` }}
            />
            {labels.officialOutturnLabel}
          </span>
        )}
      </div>

      {/* per-vintage status cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
        {vintages.map((v) => {
          const isPending = v.status === "pending" || v.point === null;
          return (
            <div
              key={v.vintage}
              className="border border-stone-200 rounded-lg p-3"
              style={
                currentPosition && currentPosition === v.vintage
                  ? { borderColor: TEAL }
                  : undefined
              }
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-stone-600">
                  {stepLabel(v, labels)}
                </span>
                <span
                  className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${badgeClass(
                    v.status
                  )}`}
                >
                  {badgeText(v.status)}
                </span>
              </div>
              <div
                className="text-2xl font-black tabular-nums"
                style={{
                  color: isPending
                    ? STONE
                    : v.status === "authoritative"
                      ? TEAL
                      : v.point !== null && v.point < 0
                        ? RED
                        : STONE_DARK,
                }}
              >
                {isPending ? "—" : fmtSignedPct(v.point as number)}
              </div>
              <div className="text-[10px] text-stone-400 mt-0.5">
                {isPending ? labels.pendingBadge : localizedDate(v.as_of, locale)}
                {typeof v.gap_to_outturn === "number" && (
                  <>
                    {" · "}
                    {labels.officialOutturnLabel} Δ{" "}
                    {fmtSignedPct(v.gap_to_outturn)}
                  </>
                )}
              </div>
              <p
                className="text-[11px] leading-snug mt-2"
                style={{
                  color:
                    v.status === "authoritative"
                      ? TEAL
                      : v.status === "pending"
                        ? STONE
                        : AMBER,
                }}
              >
                {reliabilityText(v.status)}
              </p>
            </div>
          );
        })}
      </div>

      {/* "what moved the estimate" caption (text-only v1) */}
      {movedCaption && (
        <p className="text-xs text-stone-500 mt-4">{movedCaption}</p>
      )}
    </div>
  );
}
