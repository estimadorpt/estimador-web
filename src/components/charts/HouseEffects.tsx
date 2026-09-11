"use client";

import { useTranslations } from "next-intl";
import { partyColors } from "@/lib/config/colors";

import type { HouseEffect } from '@/types';

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
  const t = useTranslations("forecast");
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-stone-500">
        <p>{t("houseEffectsLoading")}</p>
      </div>
    );
  }

  // Transform data format if needed
  const transformedData = data.map(d => ({
    pollster: d.pollster,
    party: d.party,
    effect: d.house_effect ?? d.effect ?? 0
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
      <div className="bg-cream border border-stone-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-stone-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-stone-700 w-40">
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
            <tbody className="divide-y divide-stone-200">
              {pollsters.map(pollster => (
                <tr key={pollster}>
                  <td className="px-4 py-3 text-sm font-medium text-stone-900 bg-stone-50">
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
                          color: Math.abs(effect) > 0.25 ? "white" : "#434d48"
                        }}
                        title={`${pollster} → ${party}: ${effect.toFixed(3)} logit`}
                      >
                        {showValue && (
                          <span>
                            {effect > 0 ? '+' : ''}{effect.toFixed(2)}
                          </span>
                        )}
                        
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-stone-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
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
      
      <div className="mt-4 text-sm text-stone-600 space-y-2">
        <p>
          <strong>{t("houseEffectsTerm")}</strong> {t("houseEffectsExplainer")}
        </p>
        <p className="text-xs">{t("houseEffectsValuesNote")}</p>
      </div>
    </div>
  );
}
