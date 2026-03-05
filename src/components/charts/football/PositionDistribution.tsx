"use client";

interface PositionDistributionProps {
  probs: number[];
  teamColor: string;
  locale: string;
}

function ordinal(n: number, locale: string): string {
  if (locale === "pt") return `${n}º`;
  if (n % 100 >= 11 && n % 100 <= 13) return `${n}th`;
  const last = n % 10;
  if (last === 1) return `${n}st`;
  if (last === 2) return `${n}nd`;
  if (last === 3) return `${n}rd`;
  return `${n}th`;
}

export function PositionDistribution({ probs, teamColor, locale }: PositionDistributionProps) {
  if (!probs || probs.length === 0) return null;

  // Filter positions with >0.5% probability, convert to percentage
  const positions = probs
    .map((p, i) => ({ position: i + 1, prob: p * 100 }))
    .filter(d => d.prob > 0.5);

  if (positions.length === 0) return null;

  const maxProb = Math.max(...positions.map(d => d.prob));

  return (
    <div className="space-y-1">
      {positions.map(({ position, prob }) => {
        const opacity = 0.3 + (prob / maxProb) * 0.7;
        const widthPct = Math.max((prob / maxProb) * 100, 2);

        return (
          <div key={position} className="flex items-center gap-2">
            {/* Position label */}
            <div className="w-10 text-right text-xs font-medium text-stone-500 tabular-nums">
              {ordinal(position, locale)}
            </div>

            {/* Bar with background track */}
            <div className="flex-1 h-6 bg-stone-50 relative">
              <div
                className="h-full"
                style={{
                  width: `${widthPct}%`,
                  backgroundColor: teamColor,
                  opacity,
                }}
              />
            </div>

            {/* Percentage */}
            <div className="w-12 text-right text-xs font-semibold tabular-nums text-stone-700">
              {prob < 1 ? "<1%" : `${Math.round(prob)}%`}
            </div>
          </div>
        );
      })}
    </div>
  );
}
