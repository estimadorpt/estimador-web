"use client";

import { teamLogoSrc, teamDisplayName } from "@/lib/config/football";
import { ChartTable } from "@/components/viz/ChartTable";
import { formatDecimal, formatSigned } from "@/lib/football-format";

export interface LuckEntry {
  team: string;
  actualPts: number;
  expectedPts: number;
  delta: number; // actual - expected (positive = overperforming)
}

interface LuckIndexProps {
  entries: LuckEntry[];
  labels: {
    overperforming?: string;
    underperforming?: string;
    /** Suffix for the real points, e.g. "pts". */
    pointsShort?: string;
    /** Suffix for the modelled points, e.g. "esperados". */
    expectedShort?: string;
  };
  locale?: string;
}

/**
 * Points minus xPts per club, diverging from zero. On a phone each club's
 * full name and its points sit on one line and the bar gets the whole width
 * below, so no name is cut and no value label runs into a name (audit
 * UXM2-07, PUB2-10). Every bar prints its value, small ones just past the
 * zero line (UXD2-21). The drawing is hidden from assistive technology,
 * which gets a summary and the table twin (A11Y2-15).
 */
export function LuckIndex({ entries, labels, locale = "pt" }: LuckIndexProps) {
  if (!entries || entries.length === 0) return null;

  const maxAbsDelta = Math.max(...entries.map(e => Math.abs(e.delta)), 0.5);
  const pt = locale !== "en";
  const pts = labels.pointsShort ?? "pts";
  const exp = labels.expectedShort ?? (pt ? "esperados" : "expected");
  const under = labels.underperforming ?? (pt ? "Abaixo do esperado" : "Below expected");
  const over = labels.overperforming ?? (pt ? "Acima do esperado" : "Above expected");

  const top = entries[0];
  const bottom = entries[entries.length - 1];
  const summary = pt
    ? `Pontos reais menos pontos esperados (xPts). Mais acima do esperado: ${teamDisplayName(top.team)} (${formatSigned(top.delta, locale, 1)}); mais abaixo: ${teamDisplayName(bottom.team)} (${formatSigned(bottom.delta, locale, 1)}). Os valores de todas as equipas estão na tabela abaixo.`
    : `Actual points minus expected points (xPts). Furthest above: ${teamDisplayName(top.team)} (${formatSigned(top.delta, locale, 1)}); furthest below: ${teamDisplayName(bottom.team)} (${formatSigned(bottom.delta, locale, 1)}). Every club's values are in the table below.`;

  const points = (entry: LuckEntry) => (
    <span className="text-right leading-tight">
      <span className="block text-xs font-semibold tabular-nums text-stone-700">{entry.actualPts} {pts}</span>
      <span className="block text-[11px] tabular-nums text-stone-600">{formatDecimal(entry.expectedPts, locale, 1)} {exp}</span>
    </span>
  );

  return (
    <div>
      <p className="sr-only">{summary}</p>
      <div aria-hidden="true">
        {/* Which side is which, at the two ends of the track. */}
        <div className="mb-3 flex items-center gap-2">
          <div className="hidden w-28 flex-shrink-0 sm:block" />
          <div className="flex min-w-0 flex-1 justify-between gap-x-2 px-1 text-[11px] font-bold text-stone-600">
            <span className="text-red-700">← {under}</span>
            <span className="text-emerald-700">{over} →</span>
          </div>
          <div className="hidden w-36 flex-shrink-0 sm:block" />
        </div>

        <div className="space-y-2 sm:space-y-1">
          {entries.map((entry) => {
            const barPct = (Math.abs(entry.delta) / maxAbsDelta) * 40; // max 40% of the track
            const isPositive = entry.delta >= 0;
            // The value sits just past the bar's end, kept inside the track.
            const labelAt = Math.min(50 + barPct + 1, 86);

            return (
              <div
                key={entry.team}
                className="sm:flex sm:items-center sm:gap-2"
                title={`${teamDisplayName(entry.team)}: ${entry.actualPts} ${pts}, ${formatDecimal(entry.expectedPts, locale, 1)} ${exp} (${formatSigned(entry.delta, locale, 1)})`}
              >
                {/* Name (and, on a phone, the points) */}
                <div className="mb-0.5 flex items-center justify-between gap-2 sm:mb-0 sm:w-28 sm:flex-shrink-0">
                  <span className="flex min-w-0 items-center gap-1.5">
                    {teamLogoSrc(entry.team) ? (
                      <img src={teamLogoSrc(entry.team)} alt="" width={16} height={16} loading="lazy" decoding="async" className="w-4 h-4 object-contain flex-shrink-0" />
                    ) : (
                      <span className="w-1 h-4 flex-shrink-0 bg-stone-400" />
                    )}
                    <span className="text-xs font-medium text-stone-700 sm:truncate">{teamDisplayName(entry.team)}</span>
                  </span>
                  <span className="sm:hidden">{points(entry)}</span>
                </div>

                {/* Diverging bar */}
                <div className="relative h-5 flex-1">
                  <div className="absolute inset-0 bg-parchment" />
                  <div className="absolute top-0 bottom-0 w-px bg-stone-500" style={{ left: '50%' }} />
                  <div
                    className="absolute top-0 h-full"
                    style={isPositive
                      ? { left: '50%', width: `${barPct}%`, backgroundColor: '#3a6b50', opacity: 0.45 }
                      : { left: `${50 - barPct}%`, width: `${barPct}%`, backgroundColor: '#a3543a', opacity: 0.35 }}
                  />
                  <div
                    className={`absolute top-0 flex h-full items-center text-[11px] font-bold tabular-nums ${isPositive ? "text-emerald-700" : "text-red-700"}`}
                    style={isPositive ? { left: `${labelAt}%` } : { right: `${labelAt}%` }}
                  >
                    {formatSigned(entry.delta, locale, 1)}
                  </div>
                </div>

                {/* Real points against modelled ones, written out (a bare
                    "12 vs 9" reads as a scoreline). */}
                <div className="hidden w-36 flex-shrink-0 sm:block">{points(entry)}</div>
              </div>
            );
          })}
        </div>
      </div>
      <ChartTable
        caption={pt ? "Pontos reais e pontos esperados a partir do xG, por equipa" : "Actual points and expected points from xG, by team"}
        columns={[pt ? "Equipa" : "Team", pt ? "Pontos" : "Points", pt ? "Esperados (xPts)" : "Expected (xPts)", pt ? "Diferença" : "Difference"]}
        rows={entries.map(e => [
          teamDisplayName(e.team),
          e.actualPts,
          formatDecimal(e.expectedPts, locale, 1),
          formatSigned(e.delta, locale, 1),
        ])}
      />
    </div>
  );
}
