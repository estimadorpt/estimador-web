"use client";

import { useState } from "react";
import { ligaTeamColors, teamDisplayName, teamLogoSrc } from "@/lib/config/football";
import { Dices } from "lucide-react";

export interface SeasonSamples {
  season: string;
  matchday: number;
  n_sims: number;
  n_samples: number;
  teams: string[];
  p_champion: number[];
  position_probs: number[][];
  points_q05: number[];
  /** Quartiles — published next to the 90% bounds, used by the league table. */
  points_q25?: number[];
  points_q50: number[];
  points_q75?: number[];
  points_q95: number[];
  samples: { pos: number[]; pts: number[]; gd: number[] }[];
}

interface SeasonDrawProps {
  samples: SeasonSamples;
  locale?: string;
}

/** One-click draw of a single complete simulated season (real samples
 *  from the 50k-season Monte Carlo — not made up). */
export function SeasonDraw({ samples, locale = "pt" }: SeasonDrawProps) {
  const pt = locale !== "en";
  const [drawIdx, setDrawIdx] = useState<number | null>(null);

  const t = {
    title: pt ? "Sorteia uma época" : "Draw a season",
    intro: pt
      ? `Cada clique mostra UMA época completa tirada à sorte das ${samples.n_sims.toLocaleString("pt-PT")} simulações do modelo — um futuro possível, não uma previsão.`
      : `Each click shows ONE complete season drawn from the model's ${samples.n_sims.toLocaleString("en")} simulations — a possible future, not a prediction.`,
    button: drawIdx === null ? (pt ? "Sortear" : "Draw") : (pt ? "Sortear outra" : "Draw again"),
    champion: pt ? "Campeão" : "Champion",
    inSims: (p: number) =>
      pt
        ? `acontece em ${(p * 100).toFixed(p < 0.01 ? 1 : 0)}% das simulações`
        : `happens in ${(p * 100).toFixed(p < 0.01 ? 1 : 0)}% of simulations`,
    relegated: pt ? "Despromovidos" : "Relegated",
    ptsLabel: pt ? "Pts" : "Pts",
    disclaimer: pt
      ? "Intervalos de pontos finais verificados como calibrados em 8 épocas históricas."
      : "Final-points intervals verified as calibrated over 8 historical seasons.",
  };

  const draw = () => {
    let next = Math.floor(Math.random() * samples.samples.length);
    if (next === drawIdx) next = (next + 1) % samples.samples.length;
    setDrawIdx(next);
  };

  const s = drawIdx !== null ? samples.samples[drawIdx] : null;

  // Rows sorted by drawn position
  const rows = s
    ? samples.teams
        .map((team, ti) => ({
          team,
          pos: s.pos[ti],
          pts: s.pts[ti],
          gd: s.gd[ti],
          pChamp: samples.p_champion[ti],
        }))
        .sort((a, b) => a.pos - b.pos)
    : [];

  const champion = rows[0];
  const relegated = rows.slice(-2);

  return (
    <div className="border border-stone-200 rounded-xl p-4 sm:p-6 bg-stone-50">
      <div className="flex items-center gap-2 mb-1">
        <Dices className="w-5 h-5 text-emerald-700" />
        <h3 className="font-bold text-stone-900">{t.title}</h3>
      </div>
      <p className="text-sm text-stone-500 mb-4">{t.intro}</p>

      <button
        onClick={draw}
        className="mb-4 px-4 py-2 rounded-lg bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800 transition-colors"
      >
        {t.button}
      </button>

      {s && champion && (
        <div>
          <div className="mb-3 text-sm">
            <span className="font-bold" style={{ color: ligaTeamColors[champion.team] ?? "#333" }}>
              {t.champion}: {teamDisplayName(champion.team)} ({champion.pts} {t.ptsLabel})
            </span>{" "}
            <span className="text-stone-500">— {t.inSims(champion.pChamp)}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-0.5 text-sm">
            {rows.map((r) => (
              <div
                key={r.team}
                className={`flex items-center gap-2 py-0.5 px-1 rounded ${
                  r.pos === 1
                    ? "bg-emerald-100"
                    : r.pos >= samples.teams.length - 1
                      ? "bg-red-50"
                      : ""
                }`}
              >
                <span className="w-5 text-right text-stone-400 tabular-nums">{r.pos}</span>
                {teamLogoSrc(r.team) && (
                  <img src={teamLogoSrc(r.team)} alt="" className="w-4 h-4 object-contain" />
                )}
                <span className="flex-1 truncate">{teamDisplayName(r.team)}</span>
                <span className="tabular-nums font-medium">{r.pts}</span>
                <span className="w-9 text-right tabular-nums text-stone-400 text-xs">
                  {r.gd > 0 ? `+${r.gd}` : r.gd}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-2 text-xs text-stone-400">
            {t.relegated}: {relegated.map((r) => teamDisplayName(r.team)).join(", ")} · {t.disclaimer}
          </div>
        </div>
      )}
    </div>
  );
}
