"use client";

import { partyColors } from "@/lib/config/colors";

interface HouseEffect {
  pollster: string;
  party: string;
  effect: number;
  n_polls: number;
}

interface HouseEffectsProps {
  data: HouseEffect[];
}

// Color interpolation for the heatmap
function getHeatmapColor(value: number): string {
  // Normalize value to [-1, 1] for color mapping
  const normalized = Math.max(-1, Math.min(1, value / 0.4));
  
  if (Math.abs(normalized) < 0.05) return "#f8f9fa";
  
  if (normalized > 0) {
    // Softer red tones for positive values
    const intensity = Math.abs(normalized);
    const r = Math.round(254 + (220 - 254) * intensity);
    const g = Math.round(226 + (38 - 226) * intensity);
    const b = Math.round(226 + (38 - 226) * intensity);
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    // Softer blue tones for negative values
    const intensity = Math.abs(normalized);
    const r = Math.round(219 + (69 - 219) * intensity);
    const g = Math.round(234 + (123 - 234) * intensity);
    const b = Math.round(254 + (157 - 254) * intensity);
    return `rgb(${r}, ${g}, ${b})`;
  }
}

export function HouseEffects({ data }: HouseEffectsProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>House effects analysis loading...</p>
      </div>
    );
  }

  // Transform data format if needed
  const transformedData = data.map(d => ({
    pollster: d.pollster,
    party: d.party,
    effect: (d as any).house_effect || d.effect || 0,
    n_polls: d.n_polls || 5
  }));

  // Get unique pollsters and parties
  const pollsters = Array.from(new Set(transformedData.map(d => d.pollster))).sort();
  const parties = Object.keys(partyColors).filter(party => 
    transformedData.some(d => d.party === party)
  );

  // Create a matrix for easy lookup
  const matrix: Record<string, Record<string, number>> = {};
  transformedData.forEach(d => {
    if (!matrix[d.pollster]) matrix[d.pollster] = {};
    matrix[d.pollster][d.party] = d.effect;
  });

  return (
    <div className="w-full">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-40">
                  Pollster
                </th>
                {parties.map(party => (
                  <th
                    key={party}
                    className="px-3 py-3 text-center text-sm font-semibold w-20"
                    style={{ color: partyColors[party as keyof typeof partyColors] }}
                  >
                    {party}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pollsters.map(pollster => (
                <tr key={pollster}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 bg-gray-50">
                    {pollster}
                  </td>
                  {parties.map(party => {
                    const effect = matrix[pollster]?.[party] || 0;
                    const showValue = Math.abs(effect) > 0.02;
                    
                    return (
                      <td
                        key={`${pollster}-${party}`}
                        className="px-3 py-3 text-center text-xs font-semibold relative group cursor-help"
                        style={{ 
                          backgroundColor: getHeatmapColor(effect),
                          color: Math.abs(effect) > 0.25 ? "white" : "#374151"
                        }}
                        title={`${pollster} → ${party}: ${effect.toFixed(3)} logit`}
                      >
                        {showValue && (
                          <span>
                            {effect > 0 ? '+' : ''}{effect.toFixed(2)}
                          </span>
                        )}
                        
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                          {pollster} → {party}: {effect.toFixed(3)} logit
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="mt-4 text-sm text-gray-600 space-y-2">
        <p>
          <strong>House effects</strong> show how each pollster systematically differs from the polling average in logit space. 
          Red cells indicate the pollster tends to show higher support for that party, blue cells show lower support.
        </p>
        <p className="text-xs">
          Values are logit deviations. Larger absolute values indicate stronger systematic bias. Hover over cells for exact values.
        </p>
      </div>
    </div>
  );
}