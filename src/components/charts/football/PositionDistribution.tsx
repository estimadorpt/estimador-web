"use client";

import { ChartTable } from "@/components/viz/ChartTable";
import { formatOrdinal, formatPercent } from "@/lib/football-format";

interface PositionDistributionProps {
  probs: number[];
  teamColor: string;
  locale: string;
}

const ordinal = formatOrdinal;

export function PositionDistribution({ probs, teamColor, locale }: PositionDistributionProps) {
  if (!probs || probs.length === 0) return null;

  // Filter positions with >0.5% probability, convert to percentage
  const positions = probs
    .map((p, i) => ({ position: i + 1, prob: p * 100 }))
    .filter(d => d.prob > 0.5);

  if (positions.length === 0) return null;

  const pt = locale !== "en";
  const pctLabel = (prob: number) => formatPercent(prob / 100, locale);

  return (
    <div>
    <div className="space-y-1">
      {positions.map(({ position, prob }) => {
        // A fixed 0–100% scale and one opacity: a 40% bar fills 40% of the
        // track, not all of it (audit UXD2-V01).
        const widthPct = Math.max(prob, 0.5);

        return (
          <div
            key={position}
            className="flex items-center gap-2"
            title={pt ? `${ordinal(position, locale)} lugar: ${pctLabel(prob)} das simulações` : `${ordinal(position, locale)} place: ${pctLabel(prob)} of simulations`}
          >
            {/* Position label */}
            <div className="w-10 text-right text-xs font-medium text-stone-500 tabular-nums">
              {ordinal(position, locale)}
            </div>

            {/* Bar with background track */}
            <div className="flex-1 h-6 bg-parchment relative">
              <div
                className="h-full"
                style={{
                  width: `${widthPct}%`,
                  backgroundColor: teamColor,
                  opacity: 0.85,
                }}
              />
              {[25, 50, 75].map(tick => (
                <span key={tick} aria-hidden="true" className="absolute inset-y-0 w-px bg-paper" style={{ left: `${tick}%` }} />
              ))}
            </div>

            {/* Percentage */}
            <div className="w-12 text-right text-xs font-semibold tabular-nums text-stone-700">
              {pctLabel(prob)}
            </div>
          </div>
        );
      })}
    </div>
    <div aria-hidden="true" className="mt-1 flex items-center gap-2 text-[11px] tabular-nums text-stone-600">
      <div className="w-10" />
      <div className="relative h-4 flex-1">
        {[0, 25, 50, 75, 100].map(tick => (
          <span key={tick} className="absolute -translate-x-1/2" style={{ left: `${tick}%` }}>{tick}%</span>
        ))}
      </div>
      <div className="w-12" />
    </div>
    {/* The twin lists every position, including those under 0,5% the bars leave out. */}
    <ChartTable
      caption={pt ? "Probabilidade de terminar em cada posição" : "Probability of finishing in each position"}
      columns={[pt ? "Posição" : "Position", pt ? "Probabilidade" : "Probability"]}
      rows={probs.map((p, i) => [
        ordinal(i + 1, locale),
        formatPercent(p, locale),
      ])}
    />
    </div>
  );
}
